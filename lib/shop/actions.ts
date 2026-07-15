"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSubscriber } from "@/lib/billing/access";
import { slugify } from "@/lib/shop/slug";
import { checkShopContent } from "@/lib/shop/content-policy";

export type ShopActionResult = { ok: boolean; error?: string };

// Finds a free slug for a title. Uniqueness is checked with the admin client
// because RLS would hide other users' projects from the normal client.
async function uniqueSlug(base: string): Promise<string> {
  const admin = createAdminClient();
  let slug = base;
  let n = 1;
  // Guard against runaway loops; in practice a couple of tries at most.
  while (n < 1000) {
    const { data } = await admin
      .from("projects")
      .select("id")
      .eq("shop_slug", slug)
      .maybeSingle();
    if (!data) return slug;
    n += 1;
    slug = `${base}-${n}`;
  }
  return `${base}-${Date.now()}`;
}

// Publishes a finished book to the Buchshop. Requirements:
//   - caller owns the project
//   - caller has an active subscription (Abonnent)
//   - every chapter is written (book is finished)
//   - a valid Amazon link is provided (target of the "Bei Amazon kaufen" CTA)
export async function publishToShopAction(
  projectId: string,
  amazonUrl: string,
): Promise<ShopActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Nicht angemeldet." };

  const { data: project } = await supabase
    .from("projects")
    .select("id, user_id, title, topic, shop_slug")
    .eq("id", projectId)
    .single();
  if (!project || project.user_id !== user.id) {
    return { ok: false, error: "Projekt nicht gefunden." };
  }

  if (!(await isSubscriber(supabase, user.id))) {
    return {
      ok: false,
      error:
        "Das Veröffentlichen im Buchshop ist Abonnenten vorbehalten. Starte ein Abo, um deine Bücher im Shop zu zeigen.",
    };
  }

  const { data: chapters } = await supabase
    .from("chapters")
    .select("content")
    .eq("project_id", projectId);
  const list = chapters ?? [];
  const finished = list.length > 0 && list.every((c) => Boolean(c.content));
  if (!finished) {
    return {
      ok: false,
      error:
        "Das Buch ist noch nicht fertig — alle Kapitel müssen geschrieben sein, bevor du es im Shop veröffentlichst.",
    };
  }

  // Keep clearly adult/explicit content out of the public shop (no age
  // verification there). Checks the shop-facing metadata; narrow by design.
  const { data: listingForCheck } = await supabase
    .from("kdp_listings")
    .select("subtitle, description")
    .eq("project_id", projectId)
    .maybeSingle();
  const policy = checkShopContent(
    project.title,
    project.topic,
    listingForCheck?.subtitle,
    listingForCheck?.description,
  );
  if (!policy.allowed) {
    return {
      ok: false,
      error:
        "Dieses Buch kann nicht im Buchshop veröffentlicht werden: Der Shop ist jugendfrei, explizite/18+-Inhalte sind hier nicht erlaubt. Du kannst dein Buch aber weiterhin direkt bei Amazon KDP veröffentlichen. Ist das ein Irrtum, melde dich bei welcome@buchwerk.info.",
    };
  }

  const url = amazonUrl.trim();
  // The Amazon link is optional (the "Bei Amazon kaufen" button only shows if
  // it's set); validate only when one is provided.
  if (url && !/^https?:\/\/([a-z0-9-]+\.)*amazon\.[a-z.]+\/.+/i.test(url)) {
    return {
      ok: false,
      error: "Der Amazon-Link sieht nicht gültig aus — oder lass ihn leer.",
    };
  }

  // Keep an existing slug so re-publishing preserves the URL.
  const slug =
    project.shop_slug ?? (await uniqueSlug(slugify(project.title ?? project.topic)));

  // Shop columns are not writable via RLS (security migration); ownership was
  // verified above, so write them through the service-role client.
  const admin = createAdminClient();
  const { error } = await admin
    .from("projects")
    .update({
      shop_published: true,
      shop_published_at: new Date().toISOString(),
      shop_slug: slug,
      amazon_url: url || null,
    })
    .eq("id", projectId);
  if (error) {
    return { ok: false, error: "Konnte das Buch nicht veröffentlichen." };
  }

  revalidatePath("/buchshop");
  revalidatePath(`/buchshop/${slug}`);
  revalidatePath(`/projekte/${projectId}`);
  return { ok: true };
}

/**
 * Toggles whether subscribers may read the full text in the Buchwerk-Reader.
 *
 * Deliberately separate from publishToShopAction: being listed is a low-barrier
 * shop window (we want many books), while handing out the manuscript is a real
 * decision the author has to make on purpose. An already-listed book must never
 * silently become readable.
 *
 * This is what makes reviews possible at all — without readable text there is no
 * reading to verify, and an unverified review is one we may not present as
 * coming from an actual reader (Anhang Nr. 23b UWG).
 */
export async function setShopReadableAction(
  projectId: string,
  readable: boolean,
): Promise<ShopActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Nicht angemeldet." };

  const { data: project } = await supabase
    .from("projects")
    .select("id, user_id, shop_slug")
    .eq("id", projectId)
    .single();
  if (!project || project.user_id !== user.id) {
    return { ok: false, error: "Projekt nicht gefunden." };
  }

  // shop_* columns are not writable via RLS (security migration); ownership was
  // verified above, so write through the service-role client.
  const admin = createAdminClient();
  const { error } = await admin
    .from("projects")
    .update({ shop_readable: readable })
    .eq("id", projectId);
  if (error) {
    return { ok: false, error: "Konnte die Lesefreigabe nicht ändern." };
  }

  if (project.shop_slug) revalidatePath(`/buchshop/${project.shop_slug}`);
  revalidatePath(`/projekte/${projectId}`);
  return { ok: true };
}

// Removes a book from the Buchshop. The slug is kept so a later re-publish
// reuses the same URL.
export async function unpublishFromShopAction(
  projectId: string,
): Promise<ShopActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Nicht angemeldet." };

  const { data: project } = await supabase
    .from("projects")
    .select("id, user_id, shop_slug")
    .eq("id", projectId)
    .single();
  if (!project || project.user_id !== user.id) {
    return { ok: false, error: "Projekt nicht gefunden." };
  }

  // Shop columns are not writable via RLS (security migration); ownership was
  // verified above, so write them through the service-role client.
  const admin = createAdminClient();
  const { error } = await admin
    .from("projects")
    .update({ shop_published: false, shop_published_at: null })
    .eq("id", projectId);
  if (error) {
    return { ok: false, error: "Konnte das Buch nicht zurückziehen." };
  }

  revalidatePath("/buchshop");
  if (project.shop_slug) revalidatePath(`/buchshop/${project.shop_slug}`);
  revalidatePath(`/projekte/${projectId}`);
  return { ok: true };
}
