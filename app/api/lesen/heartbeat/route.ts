import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSubscriber } from "@/lib/billing/access";
import { HEARTBEAT_SECONDS, chapterCounts } from "@/lib/shop/reading";

// Records reading progress for one chapter. The client calls this every
// HEARTBEAT_SECONDS while the tab is visible and recently interacted with.
//
// The client is not trusted with time: it may only say "I am still here" and how
// far it has scrolled. Each accepted call credits exactly HEARTBEAT_SECONDS, and
// the server rejects beats that arrive faster than that — so replaying the
// request in a loop credits nothing extra.
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  let body: { chapterId?: unknown; scroll?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const chapterId = typeof body.chapterId === "string" ? body.chapterId : null;
  const scrollRaw = typeof body.scroll === "number" ? body.scroll : 0;
  const scroll = Math.min(1, Math.max(0, scrollRaw));
  if (!chapterId) {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const admin = createAdminClient();

  // The chapter must belong to a book that is published AND readable, and must
  // not be the reader's own — same gate as the reader page itself, because an
  // API route is reachable without ever loading that page.
  const { data: chapter } = await admin
    .from("chapters")
    .select("id, project_id, content")
    .eq("id", chapterId)
    .maybeSingle();
  if (!chapter) {
    return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });
  }

  const { data: book } = await admin
    .from("projects")
    .select("id, user_id, shop_published, shop_readable")
    .eq("id", chapter.project_id)
    .maybeSingle();
  if (!book || !book.shop_published || !book.shop_readable) {
    return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });
  }
  if (book.user_id === user.id) {
    // Authors may read their own book, but it earns no progress — there is
    // nothing to review and nothing to prove.
    return NextResponse.json({ ok: true, counted: false });
  }
  if (!(await isSubscriber(supabase, user.id))) {
    return NextResponse.json({ error: "Kein Zugriff." }, { status: 402 });
  }

  const { data: existing } = await admin
    .from("reading_progress")
    .select("id, max_scroll, seconds_active, updated_at")
    .eq("chapter_id", chapterId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existing) {
    await admin.from("reading_progress").insert({
      chapter_id: chapterId,
      book_id: book.id,
      user_id: user.id,
      max_scroll: scroll,
      seconds_active: HEARTBEAT_SECONDS,
    });
    return NextResponse.json({
      ok: true,
      chapterRead: chapterCounts(chapter.content, scroll, HEARTBEAT_SECONDS),
    });
  }

  // Rate gate: credit time only if a real interval has passed since the last
  // beat. Without this, a loop of requests would mint seconds at will. A small
  // tolerance absorbs timer jitter and network latency.
  const sinceLast = Date.now() - new Date(existing.updated_at).getTime();
  const counted = sinceLast >= (HEARTBEAT_SECONDS - 2) * 1000;

  // Scroll only ever moves forward.
  const maxScroll = Math.max(existing.max_scroll, scroll);
  const secondsActive = counted
    ? existing.seconds_active + HEARTBEAT_SECONDS
    : existing.seconds_active;

  await admin
    .from("reading_progress")
    .update({
      max_scroll: maxScroll,
      seconds_active: secondsActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", existing.id);

  // Report back whether this chapter now counts, so the reader can say so
  // immediately. Without live feedback the book-level counter sits at 0 for
  // minutes and honest readers conclude the tracking is broken — which is what
  // happened on the very first real read-through.
  return NextResponse.json({
    ok: true,
    chapterRead: chapterCounts(chapter.content, maxScroll, secondsActive),
  });
}
