import "server-only";

export type BookSource = { title: string; url: string };
// One chapter's block in the grouped Quellenverzeichnis.
export type ChapterSources = { heading: string; sources: BookSource[] };

// The model appends the used-sources list after this marker (see prompts/
// kapitel.md and kapitel-vertiefen.md). Tolerant of "==QUELLEN==" spelling drift.
const MARKER = /^[ \t]*={2,}\s*QUELLEN\s*={2,}[ \t]*$/gim;

// Trailing punctuation that commonly sticks to a URL but isn't part of it.
const TRAILING = /[)\].,;:!?»"'>]+$/;
const cleanUrl = (raw: string): string => raw.replace(TRAILING, "");

/**
 * Validates the jsonb value from `chapters.sources` into a typed source list.
 * Anything malformed (or a column that doesn't exist yet) collapses to [].
 */
export function coerceSources(value: unknown): BookSource[] {
  if (!Array.isArray(value)) return [];
  const out: BookSource[] = [];
  for (const s of value) {
    if (
      s &&
      typeof s === "object" &&
      typeof (s as { title?: unknown }).title === "string" &&
      typeof (s as { url?: unknown }).url === "string"
    ) {
      const { title, url } = s as { title: string; url: string };
      out.push({ title, url });
    }
  }
  return out;
}

/**
 * Splits a raw chapter response into the visible body and the used-sources the
 * model reported after the `===QUELLEN===` marker. The marker + list are never
 * shown in the chapter — they only feed the Quellenverzeichnis at the book's end.
 * A chapter written before this feature (no marker) yields the whole text as
 * body and no sources.
 */
export function splitChapterSources(raw: string): {
  body: string;
  sources: BookSource[];
} {
  const matches = [...raw.matchAll(MARKER)];
  if (matches.length === 0) return { body: raw.trim(), sources: [] };
  // Use the last marker: it's appended at the very end, and prose is extremely
  // unlikely to contain a later one.
  const last = matches[matches.length - 1];
  const idx = last.index ?? raw.length;
  const body = raw.slice(0, idx).trim();
  const block = raw.slice(idx + last[0].length);
  return { body, sources: parseUsedSources(block) };
}

/**
 * Parses the lines below the marker into a deduped source list. Each line is
 * expected as "- Titel — URL" (also accepts markdown links and title-only
 * entries). "keine" means the chapter used no sources.
 */
export function parseUsedSources(block: string): BookSource[] {
  const out: BookSource[] = [];
  const seen = new Set<string>();

  for (const rawLine of block.split("\n")) {
    const line = rawLine.trim().replace(/^[-*•]\s+/, "").trim();
    if (!line || /^keine[.!]?$/i.test(line)) continue;

    let title = "";
    let url = "";

    const md = line.match(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/);
    if (md) {
      title = md[1].trim();
      url = cleanUrl(md[2]);
    } else {
      const um = line.match(/https?:\/\/[^\s)]+/);
      if (um) {
        url = cleanUrl(um[0]);
        title = line
          .slice(0, um.index)
          .replace(/[—:–-]\s*$/, "")
          .replace(/\*\*/g, "")
          .trim();
      } else {
        // Source without a URL (e.g. a book or study). Keep it as a title entry.
        title = line.replace(/\*\*/g, "").trim();
      }
    }

    if (url && !/^https?:\/\//i.test(url)) continue;
    const key = url || title.toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);

    if (!title && url) {
      try {
        title = new URL(url).hostname.replace(/^www\./, "");
      } catch {
        title = url;
      }
    }
    out.push({ title, url });
  }

  return out;
}
