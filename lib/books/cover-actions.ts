"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { claudeText } from "@/lib/ai/anthropic";
import { loadPrompt } from "@/lib/ai/prompts";
import { generateCoverImage, type CoverModel } from "@/lib/ai/replicate";
import { gateProduction } from "@/lib/billing/access";

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

export async function generateCoverAction(
  projectId: string,
  prompt: string,
  model: CoverModel,
): Promise<CoverResult> {
  const trimmed = prompt.trim();
  if (!trimmed) return { ok: false, error: "Bitte gib eine Bildbeschreibung ein." };
  if (model !== "schnell" && model !== "pro") {
    return { ok: false, error: "Ungültiges Modell." };
  }

  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .single();
  if (!project) return { ok: false, error: "Projekt nicht gefunden." };

  const gate = await gateProduction(supabase, projectId);
  if (!gate.ok) return { ok: false, error: gate.error };

  try {
    const imageUrl = await generateCoverImage(trimmed, model);

    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) throw new Error("Bild-Download fehlgeschlagen.");
    const contentType =
      imageResponse.headers.get("content-type") ?? "image/png";
    const ext = contentType.includes("png")
      ? "png"
      : contentType.includes("jpeg")
        ? "jpg"
        : "webp";
    const bytes = new Uint8Array(await imageResponse.arrayBuffer());

    const admin = createAdminClient();
    const coverId = crypto.randomUUID();
    const path = `${projectId}/${coverId}.${ext}`;

    const { error: uploadError } = await admin.storage
      .from("covers")
      .upload(path, bytes, { contentType, upsert: true });
    if (uploadError) throw new Error("Upload fehlgeschlagen.");

    const {
      data: { publicUrl },
    } = admin.storage.from("covers").getPublicUrl(path);

    const { count } = await admin
      .from("covers")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId);

    const { error: insertError } = await admin.from("covers").insert({
      id: coverId,
      project_id: projectId,
      storage_path: path,
      image_url: publicUrl,
      prompt: trimmed,
      model,
      is_selected: (count ?? 0) === 0,
    });
    if (insertError) throw new Error("Speichern fehlgeschlagen.");

    revalidatePath(`/projekte/${projectId}/cover`);
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("402") || message.toLowerCase().includes("credit")) {
      return {
        ok: false,
        error:
          "Replicate-Guthaben fehlt. Bitte unter replicate.com/account/billing aufladen, ein paar Minuten warten und erneut versuchen.",
      };
    }
    return {
      ok: false,
      error: "Das Cover konnte nicht erstellt werden. Versuch es noch einmal.",
    };
  }
}

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
