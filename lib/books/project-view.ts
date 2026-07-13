import "server-only";

import { STALE_GENERATION_MS, MIN_TOTAL_WORDS, countWords } from "./generate";

export type ChapterRow = {
  id: string;
  position: number;
  heading: string;
  summary: string | null;
  content: string | null;
  status: string;
  updated_at: string;
};

export type ChapterView = ChapterRow & {
  // Live generation state derived from the DB status + row age. A chapter in
  // "schreiben" that's still recent is generating; once it's older than the
  // stale threshold the function was almost certainly killed, so we treat it as
  // failed and offer a retry.
  isGenerating: boolean;
  isStale: boolean;
};

export type ProjectChapterView = {
  views: ChapterView[];
  done: number;
  hasWrittenChapters: boolean;
  finished: boolean;
  progressPct: number;
  totalWords: number;
  belowMinimum: boolean;
  anyGenerating: boolean;
  unwrittenIds: string[];
  firstUnwrittenId: string | null;
};

/**
 * Derives the shared chapter/progress state used by both the project hub and the
 * writing step, so the two stay consistent. `nowMs` is passed in (not read here)
 * to keep the calling Server Component's render deterministic.
 */
export function computeChapterView(
  chapters: ChapterRow[] | null | undefined,
  nowMs: number,
): ProjectChapterView {
  const list = chapters ?? [];
  const views: ChapterView[] = list.map((c) => {
    const writing = c.status === "schreiben";
    const ageMs = nowMs - new Date(c.updated_at).getTime();
    const isGenerating = writing && ageMs < STALE_GENERATION_MS;
    const isStale =
      (writing && ageMs >= STALE_GENERATION_MS) || c.status === "fehler";
    return { ...c, isGenerating, isStale };
  });

  const done = views.filter((c) => c.status === "fertig").length;
  const hasWrittenChapters = views.some((c) => Boolean(c.content));
  const finished = views.length > 0 && views.every((c) => Boolean(c.content));
  const progressPct = views.length
    ? Math.round((done / views.length) * 100)
    : 0;
  const totalWords = views.reduce(
    (sum, c) => sum + (c.content ? countWords(c.content) : 0),
    0,
  );
  const belowMinimum = hasWrittenChapters && totalWords < MIN_TOTAL_WORDS;
  const anyGenerating = views.some((c) => c.isGenerating);
  const unwrittenIds = views.filter((c) => !c.content).map((c) => c.id);
  const firstUnwrittenId = unwrittenIds[0] ?? null;

  return {
    views,
    done,
    hasWrittenChapters,
    finished,
    progressPct,
    totalWords,
    belowMinimum,
    anyGenerating,
    unwrittenIds,
    firstUnwrittenId,
  };
}
