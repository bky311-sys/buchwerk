"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { claudeText } from "@/lib/ai/anthropic";
import { loadPrompt } from "@/lib/ai/prompts";
import { normalizeCoverTitleStyle } from "@/lib/books/cover-style";

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

// The back cover prints the Klappentext (blurb). It lives in
// kdp_listings.description — the same text KDP uses — but the cover step comes
// before the listing step, so we let the author write it here already. Upsert by
// project_id touches only the description; a later full listing generation fills
// the rest.
export async function updateBlurbAction(
  projectId: string,
  blurb: string,
): Promise<CoverResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("kdp_listings").upsert(
    { project_id: projectId, description: blurb.trim() || null },
    { onConflict: "project_id" },
  );
  if (error) return { ok: false, error: "Konnte nicht gespeichert werden." };

  return { ok: true };
}

export async function updateCoverTitleStyleAction(
  projectId: string,
  style: string,
): Promise<CoverResult> {
  const value = normalizeCoverTitleStyle(style);
  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({ cover_title_style: value })
    .eq("id", projectId);
  if (error) return { ok: false, error: "Konnte nicht gespeichert werden." };

  // No revalidatePath on purpose: the preview is client state and the PDF reads
  // the DB fresh on download, so a server re-render would only add a ~2 s lag
  // that disables the style buttons and feels like they're stuck.
  return { ok: true };
}
