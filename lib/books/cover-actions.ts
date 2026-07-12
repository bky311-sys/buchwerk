"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { claudeText } from "@/lib/ai/anthropic";
import { loadPrompt } from "@/lib/ai/prompts";

export type CoverResult = { ok: boolean; error?: string };
export type SuggestResult = { ok: boolean; prompt?: string; error?: string };

export async function suggestCoverPromptAction(
  projectId: string,
): Promise<SuggestResult> {
  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("title, topic, audience")
    .eq("id", projectId)
    .single();
  if (!project) return { ok: false, error: "Projekt nicht gefunden." };

  try {
    const prompt = await loadPrompt("cover-prompt", {
      titel: project.title ?? project.topic,
      thema: project.topic,
      zielgruppe: project.audience ?? "allgemein interessierte Erwachsene",
    });
    const text = await claudeText({
      messages: [{ role: "user", content: prompt }],
      maxTokens: 400,
    });
    return { ok: true, prompt: text.trim() };
  } catch {
    return { ok: false, error: "Es konnte kein Prompt vorgeschlagen werden." };
  }
}

// Cover generation lives in lib/books/cover-generate.ts and is driven through
// the /api/projekte/[id]/cover route so the UI can fire it and poll the cover
// list for the result instead of blocking on one long request.

export async function selectCoverAction(coverId: string): Promise<CoverResult> {
  const supabase = await createClient();
  const { data: cover } = await supabase
    .from("covers")
    .select("project_id")
    .eq("id", coverId)
    .single();
  if (!cover) return { ok: false, error: "Cover nicht gefunden." };

  await supabase
    .from("covers")
    .update({ is_selected: false })
    .eq("project_id", cover.project_id);
  await supabase.from("covers").update({ is_selected: true }).eq("id", coverId);

  revalidatePath(`/projekte/${cover.project_id}/cover`);
  return { ok: true };
}

export async function deleteCoverAction(coverId: string): Promise<CoverResult> {
  const supabase = await createClient();
  const { data: cover } = await supabase
    .from("covers")
    .select("project_id, storage_path")
    .eq("id", coverId)
    .single();
  if (!cover) return { ok: false, error: "Cover nicht gefunden." };

  const admin = createAdminClient();
  await admin.storage.from("covers").remove([cover.storage_path]);
  await supabase.from("covers").delete().eq("id", coverId);

  revalidatePath(`/projekte/${cover.project_id}/cover`);
  return { ok: true };
}

export async function updateProjectAuthorAction(
  projectId: string,
  author: string,
): Promise<CoverResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({ author: author.trim() || null })
    .eq("id", projectId);
  if (error) return { ok: false, error: "Konnte nicht gespeichert werden." };

  revalidatePath(`/projekte/${projectId}/cover`);
  return { ok: true };
}
