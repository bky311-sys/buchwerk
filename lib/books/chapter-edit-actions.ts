"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { claudeText } from "@/lib/ai/anthropic";
import { loadPrompt } from "@/lib/ai/prompts";

export type ChapterEditResult = { ok: boolean; error?: string };

// Save manually edited chapter text.
export async function saveChapterContentAction(
  chapterId: string,
  content: string,
): Promise<ChapterEditResult> {
  const supabase = await createClient();
  const { data: chapter } = await supabase
    .from("chapters")
    .select("project_id")
    .eq("id", chapterId)
    .single();
  if (!chapter) return { ok: false, error: "Kapitel nicht gefunden." };

  const { error } = await supabase
    .from("chapters")
    .update({ content, status: content.trim() ? "fertig" : "offen" })
    .eq("id", chapterId);
  if (error) return { ok: false, error: "Konnte nicht gespeichert werden." };

  revalidatePath(`/projekte/${chapter.project_id}`);
  return { ok: true };
}

// Rewrite an existing chapter following the author's instruction.
export async function reviseChapterAction(
  chapterId: string,
  instruction: string,
): Promise<ChapterEditResult> {
  const trimmed = instruction.trim();
  if (!trimmed) return { ok: false, error: "Bitte gib eine Anweisung ein." };

  const supabase = await createClient();
  const { data: chapter } = await supabase
    .from("chapters")
    .select("id, project_id, heading, content")
    .eq("id", chapterId)
    .single();
  if (!chapter) return { ok: false, error: "Kapitel nicht gefunden." };
  if (!chapter.content) {
    return { ok: false, error: "Dieses Kapitel hat noch keinen Text." };
  }

  const { data: project } = await supabase
    .from("projects")
    .select("title, topic")
    .eq("id", chapter.project_id)
    .single();

  try {
    const prompt = await loadPrompt("lektorat", {
      titel: project?.title ?? project?.topic ?? "",
      ueberschrift: chapter.heading,
      anweisung: trimmed,
      text: chapter.content,
    });
    const content = await claudeText({
      messages: [{ role: "user", content: prompt }],
      maxTokens: 8000,
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
      error: "Die Überarbeitung ist fehlgeschlagen. Versuch es noch einmal.",
    };
  }
}
