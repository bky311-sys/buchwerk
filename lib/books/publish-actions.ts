"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type PublishResult = { ok: boolean; error?: string };

async function ownedProjectId(projectId: string): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: project } = await supabase
    .from("projects")
    .select("id, user_id")
    .eq("id", projectId)
    .single();
  return project && project.user_id === user.id ? projectId : null;
}

// Marks the book as published on Amazon KDP (manual milestone — there is no KDP
// API). The Amazon link is OPTIONAL; if given it must look like an Amazon URL.
export async function markPublishedAction(
  projectId: string,
  amazonUrl: string,
): Promise<PublishResult> {
  const owned = await ownedProjectId(projectId);
  if (!owned) return { ok: false, error: "Projekt nicht gefunden." };

  const url = amazonUrl.trim();
  if (url && !/^https?:\/\/([a-z0-9-]+\.)*amazon\.[a-z.]+\/.+/i.test(url)) {
    return {
      ok: false,
      error: "Der Amazon-Link sieht nicht gültig aus — oder lass ihn einfach leer.",
    };
  }

  const admin = createAdminClient();
  const patch: { published_at: string; amazon_url?: string } = {
    published_at: new Date().toISOString(),
  };
  if (url) patch.amazon_url = url;

  const { error } = await admin.from("projects").update(patch).eq("id", owned);
  if (error) return { ok: false, error: "Konnte nicht gespeichert werden." };

  revalidatePath(`/projekte/${projectId}`);
  revalidatePath(`/projekte/${projectId}/veroeffentlichen`);
  revalidatePath("/projekte");
  return { ok: true };
}

// Reverts the "published" milestone (e.g. marked by mistake).
export async function unmarkPublishedAction(
  projectId: string,
): Promise<PublishResult> {
  const owned = await ownedProjectId(projectId);
  if (!owned) return { ok: false, error: "Projekt nicht gefunden." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("projects")
    .update({ published_at: null })
    .eq("id", owned);
  if (error) return { ok: false, error: "Konnte nicht gespeichert werden." };

  revalidatePath(`/projekte/${projectId}`);
  revalidatePath(`/projekte/${projectId}/veroeffentlichen`);
  revalidatePath("/projekte");
  return { ok: true };
}
