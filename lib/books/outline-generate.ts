import "server-only";

import { createClient } from "@/lib/supabase/server";
import { claudeJson } from "@/lib/ai/anthropic";
import { loadPrompt } from "@/lib/ai/prompts";
import {
  outlineSchema,
  OUTLINE_JSON_SCHEMA,
  type Outline,
} from "@/lib/books/schema";

const DEFAULT_AUDIENCE = "allgemein interessierte Erwachsene";

// The projects.status value while an outline is being (re)generated. The project
// page shows a spinner and polls while status is this.
export const OUTLINE_RUNNING_STATUS = "gliederung_läuft";

export type OutlineResult = { ok: boolean; error?: string };

/**
 * Asks Claude for a book outline (title + chapters). Pure generation — no DB
 * writes. Shared by project creation and the regenerate route.
 */
export async function generateOutline(
  topic: string,
  audience: string | null,
): Promise<Outline> {
  const prompt = await loadPrompt("gliederung", {
    thema: topic,
    zielgruppe: audience ?? DEFAULT_AUDIENCE,
  });
  const raw = await claudeJson({
    messages: [{ role: "user", content: prompt }],
    maxTokens: 2000,
    jsonSchema: OUTLINE_JSON_SCHEMA,
  });
  return outlineSchema.parse(raw);
}

/**
 * Regenerates a project's outline and replaces its chapters.
 *
 * Runs behind /api/projekte/[id]/outline. The project is flipped to
 * OUTLINE_RUNNING_STATUS *before* the model call so the UI can show a spinner
 * and poll for completion, independent of whether this request's response
 * reaches the browser. The old chapters are only deleted once the new outline is
 * ready, so a failure leaves the existing book intact.
 */
export async function regenerateOutline(
  projectId: string,
): Promise<OutlineResult> {
  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("id, topic, audience, status, published_at")
    .eq("id", projectId)
    .single();
  if (!project) return { ok: false, error: "Projekt nicht gefunden." };

  if (project.published_at) {
    return {
      ok: false,
      error:
        "Dieses Buch ist veröffentlicht und gesperrt. Für Änderungen erstelle eine Neuauflage.",
    };
  }

  const previousStatus = project.status;

  await supabase
    .from("projects")
    .update({ status: OUTLINE_RUNNING_STATUS })
    .eq("id", projectId);

  try {
    const outline = await generateOutline(project.topic, project.audience);
    await supabase.from("chapters").delete().eq("project_id", projectId);
    await supabase
      .from("projects")
      .update({ title: outline.titel, status: "schreiben" })
      .eq("id", projectId);
    await supabase.from("chapters").insert(
      outline.kapitel.map((kapitel, index) => ({
        project_id: projectId,
        position: index + 1,
        heading: kapitel.ueberschrift,
        summary: kapitel.zusammenfassung,
        status: "offen",
      })),
    );
    return { ok: true };
  } catch {
    // Roll the status back so the project isn't stuck "in progress".
    await supabase
      .from("projects")
      .update({ status: previousStatus })
      .eq("id", projectId);
    return {
      ok: false,
      error: "Die Gliederung konnte nicht neu erstellt werden.",
    };
  }
}
