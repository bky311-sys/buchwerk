import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

// Reader-side data. Separate from lib/shop/queries.ts because that module builds
// the *listing* (cover, blurb, Amazon link) while this one hands out the actual
// manuscript — a much sharper gate, so it stays its own surface.

export type ReaderChapter = {
  id: string;
  position: number;
  heading: string;
  content: string | null;
};

export type ReaderBook = {
  id: string;
  slug: string;
  title: string;
  author: string | null;
  ownerId: string;
  chapters: ReaderChapter[];
};

/**
 * A readable book with all its written chapters, or null.
 *
 * Hard-filtered on shop_published AND shop_readable: being listed in the shop is
 * not consent to hand out the full text. Only chapters with status "fertig" are
 * returned — a half-written chapter is not something a reader should judge.
 */
export async function getReadableBookBySlug(
  slug: string,
): Promise<ReaderBook | null> {
  const admin = createAdminClient();
  const { data: book } = await admin
    .from("projects")
    .select("id, title, topic, author, user_id, shop_slug")
    .eq("shop_published", true)
    .eq("shop_readable", true)
    .eq("shop_slug", slug)
    .maybeSingle();
  if (!book || !book.shop_slug) return null;

  const { data: chapters } = await admin
    .from("chapters")
    .select("id, position, heading, content, status")
    .eq("project_id", book.id)
    .eq("status", "fertig")
    .order("position");

  return {
    id: book.id,
    slug: book.shop_slug,
    title: book.title ?? book.topic,
    author: book.author,
    ownerId: book.user_id,
    chapters: (chapters ?? []).map((c) => ({
      id: c.id,
      position: c.position,
      heading: c.heading,
      content: c.content,
    })),
  };
}
