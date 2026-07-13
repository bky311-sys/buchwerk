import "server-only";

// Transliterate the German characters a book title is likely to contain, then
// reduce to a filesystem-safe ASCII slug. Used as the download filename so a
// saved manuscript is recognisable ("stressfrei-mit-dem-hund.pdf") instead of a
// bare project UUID.
function slugifyTitle(title: string): string {
  const map: Record<string, string> = {
    ä: "ae",
    ö: "oe",
    ü: "ue",
    Ä: "ae",
    Ö: "oe",
    Ü: "ue",
    ß: "ss",
  };
  const slug = title
    .replace(/[äöüÄÖÜß]/g, (ch) => map[ch] ?? ch)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip remaining combining diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
  return slug || "buch";
}

/**
 * Builds a Content-Disposition value that names the download after the book
 * title. Provides both an ASCII `filename` (broad compatibility) and an RFC 5987
 * `filename*` with the full UTF-8 title so modern browsers keep umlauts.
 */
export function manuscriptDisposition(title: string, ext: "pdf" | "epub"): string {
  const asciiName = `${slugifyTitle(title)}.${ext}`;
  const utf8Name = `${title.trim() || "Buch"}.${ext}`;
  const encoded = encodeURIComponent(utf8Name).replace(
    /['()*]/g,
    (ch) => "%" + ch.charCodeAt(0).toString(16).toUpperCase(),
  );
  return `attachment; filename="${asciiName}"; filename*=UTF-8''${encoded}`;
}
