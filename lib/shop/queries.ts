import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

// A book as shown in the public Buchshop. Assembled automatically from the
// author's project data: title/author from `projects`, subtitle/description
// from `kdp_listings`, cover from the selected `covers` row.
export type ShopBook = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  author: string | null;
  description: string | null;
  coverUrl: string | null;
  coverStyle: string | null;
  amazonUrl: string | null;
};

type ProjectRow = {
  id: string;
  title: string | null;
  topic: string;
  author: string | null;
  shop_slug: string | null;
  amazon_url: string | null;
  cover_title_style: string | null;
  covers: { image_url: string; is_selected: boolean }[] | null;
  // PostgREST embeds this as a single object (project_id is the PK → one-to-one),
  // but can also be an array depending on relationship detection — handle both.
  kdp_listings:
    | { subtitle: string | null; description: string | null }
    | { subtitle: string | null; description: string | null }[]
    | null;
};

const SELECT =
  "id, title, topic, author, shop_slug, amazon_url, cover_title_style, covers(image_url, is_selected), kdp_listings(subtitle, description)";

function toShopBook(row: ProjectRow): ShopBook | null {
  if (!row.shop_slug) return null;
  const covers = row.covers ?? [];
  const cover = covers.find((c) => c.is_selected) ?? covers[0] ?? null;
  const listing = Array.isArray(row.kdp_listings)
    ? (row.kdp_listings[0] ?? null)
    : (row.kdp_listings ?? null);
  return {
    id: row.id,
    slug: row.shop_slug,
    title: row.title ?? row.topic,
    subtitle: listing?.subtitle ?? null,
    author: row.author,
    description: listing?.description ?? null,
    coverUrl: cover?.image_url ?? null,
    coverStyle: row.cover_title_style,
    amazonUrl: row.amazon_url,
  };
}

// All published books, newest first. Read via service-role and hard-filtered to
// shop_published = true, so owner-only RLS stays untouched (no anon policies).
export async function getPublishedBooks(): Promise<ShopBook[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("projects")
    .select(SELECT)
    .eq("shop_published", true)
    .order("shop_published_at", { ascending: false });

  return ((data ?? []) as unknown as ProjectRow[])
    .map(toShopBook)
    .filter((b): b is ShopBook => b !== null);
}

// IDs of published books currently boosted (via points). Best-effort: if the
// boost column isn't migrated yet, returns an empty set instead of failing.
export async function getBoostedBookIds(): Promise<Set<string>> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("projects")
    .select("id")
    .eq("shop_published", true)
    .gt("boosted_until", new Date().toISOString());
  return new Set((data ?? []).map((r) => r.id));
}

// A single published book by its slug, or null if not found / not published.
export async function getPublishedBookBySlug(
  slug: string,
): Promise<ShopBook | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("projects")
    .select(SELECT)
    .eq("shop_published", true)
    .eq("shop_slug", slug)
    .maybeSingle();

  return data ? toShopBook(data as unknown as ProjectRow) : null;
}

/**
 * Whether the author opted this book into the Buchwerk-Reader.
 *
 * A SEPARATE query on purpose. Putting shop_readable into the shared SELECT
 * above took the whole shop down while the reader migration was not applied yet:
 * PostgREST answers 400 ("column does not exist") for the ENTIRE select, so the
 * query returned null and every detail page 404'd. Selecting a column that may
 * not exist is never best-effort — isolating it in its own query is.
 */
export async function isBookReadable(bookId: string): Promise<boolean> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("projects")
    .select("shop_readable")
    .eq("id", bookId)
    .maybeSingle();
  if (error) return false; // migration not applied yet → nothing is readable
  return data?.shop_readable === true;
}
