"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { claudeJson, claudeText } from "@/lib/ai/anthropic";
import { loadPrompt } from "@/lib/ai/prompts";
import {
  newProjectSchema,
  outlineSchema,
  OUTLINE_JSON_SCHEMA,
} from "@/lib/books/schema";

const DEFAULT_AUDIENCE = "allgemein interessierte Erwachsene";

export type ProjectFormState = { error: string | null };

export async function createProjectAction(
  _prev: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const parsed = newProjectSchema.safeParse({
    topic: formData.get("topic"),
    audience: formData.get("audience"),
  });
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Bitte prüfe deine Eingabe.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/anmelden");

  const topic = parsed.data.topic.trim();
  const audience = (parsed.data.audience ?? "").trim() || null;

  // 1. Create the project row (RLS ties it to the current user).
  const { data: project, error: insertError } = await supabase
    .from("projects")
    .insert({ user_id: user.id, topic, audience, status: "gliederung" })
    .select("id")
    .single();
  if (insertError || !project) {
    return { error: "Das Projekt konnte nicht angelegt werden." };
  }

  // 2. Generate the outline.
  try {
    const prompt = await loadPrompt("gliederung", {
      thema: topic,
      zielgruppe: audience ?? DEFAULT_AUDIENCE,
    });
    const raw = await claudeJson({
      messages: [{ role: "user", content: prompt }],
      maxTokens: 2000,
      jsonSchema: OUTLINE_JSON_SCHEMA,
    });
    const outline = outlineSchema.parse(raw);

    // 3. Persist the generated title and chapters.
    await supabase
      .from("projects")
      .update({ title: outline.titel, status: "schreiben" })
      .eq("id", project.id);

    const rows = outline.kapitel.map((kapitel, index) => ({
      project_id: project.id,
      position: index + 1,
      heading: kapitel.ueberschrift,
      summary: kapitel.zusammenfassung,
      status: "offen",
    }));
    await supabase.from("chapters").insert(rows);
  } catch {
    // Roll back the empty project so the list stays clean.
    await supabase.from("projects").delete().eq("id", project.id);
    return {
      error:
        "Die Gliederung konnte nicht erstellt werden. Versuch es gleich noch einmal.",
    };
  }

  redirect(`/projekte/${project.id}`);
}

export type ChapterResult = { ok: boolean; error?: string };

export async function generateChapterAction(
  chapterId: string,
): Promise<ChapterResult> {
  const supabase = await createClient();

  const { data: chapter, error: chapterError } = await supabase
    .from("chapters")
    .select("id, project_id, position, heading, summary")
    .eq("id", chapterId)
    .single();
  if (chapterError || !chapter) {
    return { ok: false, error: "Kapitel nicht gefunden." };
  }

  const { data: project } = await supabase
    .from("projects")
    .select("title, topic, audience")
    .eq("id", chapter.project_id)
    .single();
  if (!project) {
    return { ok: false, error: "Projekt nicht gefunden." };
  }

  const { data: allChapters } = await supabase
    .from("chapters")
    .select("position, heading, summary")
    .eq("project_id", chapter.project_id)
    .order("position");

  const gliederung = (allChapters ?? [])
    .map((c) => `${c.position}. ${c.heading} — ${c.summary ?? ""}`)
    .join("\n");

  try {
    const prompt = await loadPrompt("kapitel", {
      titel: project.title ?? project.topic,
      thema: project.topic,
      zielgruppe: project.audience ?? DEFAULT_AUDIENCE,
      gliederung,
      nummer: String(chapter.position),
      ueberschrift: chapter.heading,
      zusammenfassung: chapter.summary ?? "",
    });
    const content = await claudeText({
      messages: [{ role: "user", content: prompt }],
      maxTokens: 6000,
    });

    await supabase
      .from("chapters")
      .update({ content, status: "fertig" })
      .eq("id", chapter.id);

    revalidatePath(`/projekte/${chapter.project_id}`);
    return { ok: true };
  } catch {
    return {
      ok: false,
      error:
        "Das Kapitel konnte nicht generiert werden. Versuch es noch einmal.",
    };
  }
}
