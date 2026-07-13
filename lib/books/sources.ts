import "server-only";

export type BookSource = { title: string; url: string };

// Trailing punctuation that commonly sticks to a URL when it ends a sentence or
// a markdown link, but isn't part of the address.
const TRAILING = /[)\].,;:!?»"'>]+$/;

function cleanUrl(raw: string): string {
  return raw.replace(TRAILING, "");
}

/**
 * Pulls a source list out of the free-form research dossier (`projects.research`).
 *
 * The dossier is plain markdown written by the research prompt, which lists the
 * sources it actually used as "Titel — URL" (and links them inline elsewhere).
 * Rather than depend on one exact layout, we collect every URL in the dossier,
 * pair it with the nearest preceding label (markdown link text or the "Titel —"
 * before the URL), and dedupe by URL. Returns [] when the dossier is empty or
 * contains no links — the caller then omits the Quellenverzeichnis entirely.
 */
export function extractSources(research: string | null | undefined): BookSource[] {
  const text = research?.trim();
  if (!text) return [];

  const found = new Map<string, string>(); // url -> title

  const add = (url: string, title: string) => {
    const u = cleanUrl(url);
    if (!/^https?:\/\//i.test(u)) return;
    const existing = found.get(u);
    // Keep the most informative (longest, non-empty) title we see for a URL.
    if (existing === undefined || title.length > existing.length) {
      found.set(u, title.trim());
    }
  };

  // 1) Markdown links: [title](url)
  const mdLink = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  for (const m of text.matchAll(mdLink)) add(m[2], m[1]);

  // 2) "Titel — https://…" / "Titel - https://…" / "Titel: https://…" lines.
  //    Also captures bare URLs (title falls back to the host).
  const lineUrl = /(?:^|\n)\s*[-*•]?\s*(.*?)(?:\s*[—:-]\s*)?(https?:\/\/[^\s)]+)/g;
  for (const m of text.matchAll(lineUrl)) {
    const label = m[1]
      .replace(/[[\]()]/g, "")
      .replace(/\*\*/g, "")
      .trim();
    add(m[2], label);
  }

  // 3) Any remaining bare URLs not caught above.
  const bare = /https?:\/\/[^\s)\]]+/g;
  for (const m of text.matchAll(bare)) add(m[0], "");

  return [...found.entries()].map(([url, title]) => {
    if (title) return { title, url };
    // No label: show the host as the title so the entry is still readable.
    try {
      return { title: new URL(url).hostname.replace(/^www\./, ""), url };
    } catch {
      return { title: url, url };
    }
  });
}
