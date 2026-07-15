import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { countWords } from "@/lib/books/generate";

// How reading is measured, and what it is worth.
//
// Honest framing first: this does not prove reading. Nothing does — an open tab
// with a script beats any client-side signal, and that is exactly why Medium's
// 30-second read ratio is worthless. What this does is make faking *more
// expensive and more boring than reading*, and it is the strongest measure
// available to us. That matters legally: Anhang Nr. 23b UWG asks for
// "angemessene und verhältnismäßige" verification, and proportionality is judged
// against what is possible for this platform. Rezenzo mails a PDF and can only
// ask; we own chapters.content, so a self-declared checkbox would be hard to call
// adequate. See docs/LESEN-UND-BEWERTEN.md §5.1.

// One heartbeat every 15 s from the client. The server never trusts a client
// timestamp — it credits at most this much per beat, so replaying beats faster
// buys nothing.
export const HEARTBEAT_SECONDS = 15;

// Fastest speed we still call reading. German prose sits around 200–250 wpm;
// 400 is a hurried skim. Anything above that is scrolling, not reading.
const SKIM_CAP_WPM = 400;

// A chapter counts as read when the reader reached the end AND spent at least
// the skim-cap time on it. Both are needed: scrolling to the bottom in 3 seconds
// is not reading, and sitting on page 1 for an hour is not either.
const CHAPTER_SCROLL_REQUIRED = 0.9;

// Share of a book's chapters that must count as read before a review is allowed.
// Not 100% — a reader who genuinely skips one chapter of eight still has an
// informed opinion, and a hard 100% would only train people to scroll the last
// chapter without looking.
const BOOK_CHAPTER_SHARE_REQUIRED = 0.8;

export type BookReadingState = {
  chaptersTotal: number;
  chaptersRead: number;
  chaptersRequired: number;
  hasReadEnough: boolean;
  // Ids of the chapters that already count — so the reader can show "this one is
  // done" instead of only a book-level number that sits at 0 for many minutes.
  readChapterIds: string[];
};

// Does this single chapter count as read? Same rule as in getBookReadingState.
export function chapterCounts(
  content: string | null,
  maxScroll: number,
  secondsActive: number,
): boolean {
  return (
    maxScroll >= CHAPTER_SCROLL_REQUIRED &&
    secondsActive >= chapterMinSeconds(content)
  );
}

export type ChapterProgress = {
  secondsActive: number;
  secondsNeeded: number;
  reachedEnd: boolean;
  counted: boolean;
};

/**
 * Progress on ONE chapter, for the reader's own status bar.
 *
 * These numbers are shown to the reader on purpose. Hiding the rule was the
 * earlier design and it was wrong twice over: it made an honest reader conclude
 * the tracking was broken, and it bought no protection. Secrecy is not the
 * defence here — simulating interaction every 60 s plus 90 % scroll depth for
 * every chapter is, and that costs the same whether the threshold is public or
 * not. See docs/LESEN-UND-BEWERTEN.md §5.0.
 */
export async function getChapterProgress(
  chapterId: string,
  userId: string,
  content: string | null,
): Promise<ChapterProgress> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("reading_progress")
    .select("max_scroll, seconds_active")
    .eq("chapter_id", chapterId)
    .eq("user_id", userId)
    .maybeSingle();

  const secondsActive = data?.seconds_active ?? 0;
  const maxScroll = data?.max_scroll ?? 0;
  return {
    secondsActive,
    secondsNeeded: chapterMinSeconds(content),
    reachedEnd: maxScroll >= CHAPTER_SCROLL_REQUIRED,
    counted: chapterCounts(content, maxScroll, secondsActive),
  };
}

// Minimum active seconds for a chapter of this length.
export function chapterMinSeconds(text: string | null): number {
  const words = countWords(text ?? "");
  if (words === 0) return 0;
  return Math.ceil((words / SKIM_CAP_WPM) * 60);
}

/**
 * How far a reader got through one book. Read via service-role: reading_progress
 * has no write policy at all (the numbers gate a reward, so the public anon key
 * must never touch them) and we join chapter text the reader may not select.
 */
export async function getBookReadingState(
  bookId: string,
  userId: string,
): Promise<BookReadingState> {
  const admin = createAdminClient();

  const [{ data: chapters }, { data: progress }] = await Promise.all([
    admin.from("chapters").select("id, content").eq("project_id", bookId),
    admin
      .from("reading_progress")
      .select("chapter_id, max_scroll, seconds_active")
      .eq("book_id", bookId)
      .eq("user_id", userId),
  ]);

  const all = chapters ?? [];
  const byChapter = new Map(
    (progress ?? []).map((p) => [p.chapter_id, p] as const),
  );

  const readChapterIds = all
    .filter((c) => {
      const p = byChapter.get(c.id);
      return p ? chapterCounts(c.content, p.max_scroll, p.seconds_active) : false;
    })
    .map((c) => c.id);

  const chaptersTotal = all.length;
  const chaptersRead = readChapterIds.length;
  const chaptersRequired = Math.ceil(chaptersTotal * BOOK_CHAPTER_SHARE_REQUIRED);

  return {
    chaptersTotal,
    chaptersRead,
    chaptersRequired,
    // A book with no chapters can never be "read enough" — otherwise an empty
    // project would be a free review slot.
    hasReadEnough: chaptersTotal > 0 && chaptersRead >= chaptersRequired,
    readChapterIds,
  };
}
