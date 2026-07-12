import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateCoverImage, type CoverModel } from "@/lib/ai/replicate";
import { gateProduction } from "@/lib/billing/access";

export type CoverResult = { ok: boolean; error?: string };

/**
 * Generates one cover draft with Flux (via Replicate), stores the image in the
 * "covers" bucket and inserts the metadata row.
 *
 * Runs behind the /api/projekte/[id]/cover route so the client can fire it and
 * poll the cover list for the new row — the insert lands server-side even if the
 * request's HTTP response never reaches the browser.
 */
export async function generateCover(
  projectId: string,
  prompt: string,
  model: CoverModel,
): Promise<CoverResult> {
  const trimmed = prompt.trim();
  if (!trimmed) {
    return { ok: false, error: "Bitte gib eine Bildbeschreibung ein." };
  }
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
