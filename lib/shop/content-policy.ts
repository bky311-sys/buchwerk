// Lightweight guard that keeps clearly adult / 18+ content out of the PUBLIC
// Buchshop (which has no age verification). This is not a content moderator —
// Claude and Flux already refuse explicit text/images — it's a conservative
// backstop on the shop-facing metadata (title, subtitle, blurb). Deliberately
// narrow to avoid false positives on legitimate non-fiction (e.g. health,
// biology, true-crime books).
//
// Note: this only governs Buchwerk's own shop. Authors may still publish 18+
// titles directly on Amazon KDP, which age-gates such content itself.

// Word-boundary matched, case-insensitive. Kept intentionally to unambiguous
// pornographic / explicit-sexual signals.
const DISALLOWED = [
  "porno",
  "pornografie",
  "pornografisch",
  "hardcore sex",
  "sexpraktiken",
  "erotikroman",
  "erotik-roman",
  "sexgeschichten",
  "bdsm",
  "fetisch",
  "camgirl",
  "onlyfans",
  "explizite sexszenen",
  "hentai",
  "pornographic",
  "explicit sex",
];

export type PolicyResult = { allowed: boolean; term?: string };

export function checkShopContent(...parts: (string | null | undefined)[]): PolicyResult {
  const haystack = parts
    .filter(Boolean)
    .join(" \n ")
    .toLowerCase();
  for (const term of DISALLOWED) {
    // Match as a whole token/phrase so "sexpraktiken" hits but "geschlecht"
    // (contains no listed term) and normal words don't.
    const re = new RegExp(`(^|[^\\p{L}])${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^\\p{L}]|$)`, "iu");
    if (re.test(haystack)) return { allowed: false, term };
  }
  return { allowed: true };
}
