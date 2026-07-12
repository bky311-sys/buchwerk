import "server-only";

import { createClient } from "@/lib/supabase/server";
import { claudeText } from "@/lib/ai/anthropic";
import { loadPrompt } from "@/lib/ai/prompts";
import { gateProduction } from "@/lib/billing/access";

const DEFAULT_AUDIENCE = "allgemein interessierte Erwachsene";

// A research run stuck in "läuft" longer than this is treated as failed (the
// function was killed before it could write). Web search takes longer than plain
// generation, so give it more headroom than chapter writing.
export const RESEARCH_STALE_MS = 180_000;

export type ResearchResult = { ok: boolean; error?: string };

/**
 * Builds a per-book research dossier with Claude's web search tool and stores it
 * on the project. Runs behind /api/projekte/[id]/research so the UI can fire it
 * and poll `research_status` for the result. Sets research_status to "läuft"
 * before the call, then "fertig"/"fehler".
 */
export async function generateResearch(
  projectId: string,
): Promise<ResearchResult> {
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("id, title, topic, audience")
    .eq("id", projectId)
    .single();
  if (!project) return { ok: false, error: "Projekt nicht gefunden." };

  const gate = await gateProduction(supabase, projectId);
  if (!gate.ok) return { ok: false, error: gate.error };

  // Mark as running (commits immediately so the poller sees the spinner).
  await supabase
    .from("projects")
    .update({
      research_status: "läuft",
      research_updated_at: new Date().toISOString(),
    })
    .eq("id", projectId);

  const { data: chapters } = await supabase
    .from("chapters")
    .select("position, heading, summary")
    .eq("project_id", projectId)
    .order("position");

  const gliederung = (chapters ?? [])
    .map((c) => `${c.position}. ${c.heading} — ${c.summary ?? ""}`)
    .join("\n");

  try {
    const prompt = await loadPrompt("recherche", {
      titel: project.title ?? project.topic,
      thema: project.topic,
      zielgruppe: project.audience ?? DEFAULT_AUDIENCE,
      gliederung,
    });
    const research = await claudeText({
      messages: [{ role: "user", content: prompt }],
      maxTokens: 8000,
      // Capped so web search + synthesis stays within the 60 s function limit.
      webSearch: { maxUses: 4 },
    });

    if (!research.trim()) throw new Error("Leeres Dossier.");

    await supabase
      .from("projects")
      .update({
        research,
        research_status: "fertig",
        research_updated_at: new Date().toISOString(),
      })
      .eq("id", projectId);

    return { ok: true };
  } catch {
    await supabase
      .from("projects")
      .update({
        research_status: "fehler",
        research_updated_at: new Date().toISOString(),
      })
      .eq("id", projectId);
    return {
      ok: false,
      error:
        "Die Recherche konnte nicht erstellt werden. Versuch es noch einmal.",
    };
  }
}
