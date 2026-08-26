import {
  parseCoverStyle,
  bandColorFromMain,
  bandAuthorColor,
  resolveTitleColor,
  rgbCss,
  COVER_SIZE_FACTORS,
  NEUTRAL_MAIN,
  type RGB,
} from "@/lib/books/cover-style";
import {
  accentColorFromMain,
  pickAccentWordIndex,
  scrimColor,
  splitCoverTitle,
} from "@/lib/books/cover-layout";

// Die EINE Cover-Komposition fürs Web (Cover 2.2): pure Präsentation ohne
// Hooks und ohne Server-Abhängigkeiten, damit Server-Komponenten (BookCover
// im Shop) und das Client-Studio (Live-Vorschau beim Look-Wählen) exakt
// dasselbe Cover zeigen. Vorher zeigte das Studio primitive Mini-Kacheln mit
// gequetschter fixer Typo — „null designt" (Benjamins Fund 14.08.); die echte
// Komposition sah man erst im Export.
//
// Layout in Container-Query-Einheiten (cqw): identische Komposition vom
// großen Hero bis zum 72px-Amazon-Thumbnail.

// cqw-Stufen zur Titellänge — gefühlt äquivalent zum echten fitTitle-Messen
// in Canvas/PDF (im Server-HTML gibt es keine Textmessung).
// Liefert Inline-CSS (keine Tailwind-Klassen): Die Größe hängt vom
// Nutzer-Faktor ab, und Tailwind kann dynamisch zusammengesetzte Klassen
// nicht zur Bauzeit erzeugen.
function titleScale(
  len: number,
  factor: number,
): { fontSize: string; lineHeight: string } {
  const base =
    len <= 18 ? 11 : len <= 32 ? 8.6 : len <= 52 ? 6.8 : len <= 80 ? 5.5 : 4.6;
  const size = Math.round(base * factor * 10) / 10;
  return {
    fontSize: `${size}cqw`,
    lineHeight: `${Math.round(size * 1.16 * 10) / 10}cqw`,
  };
}

export function CoverComposition({
  imageUrl,
  title: rawTitle,
  author,
  subtitle: rawSubtitle,
  styleKey,
  main,
  className = "",
  rounded = true,
}: {
  imageUrl: string;
  title: string;
  author?: string | null;
  subtitle?: string | null;
  styleKey?: string | null;
  /** Dominante Motivfarbe; null → neutraler Fallback. */
  main: RGB | null;
  className?: string;
  rounded?: boolean;
}) {
  // Doppelpunkt-Titel automatisch splitten (Haupttitel riesig, Rest als
  // Untertitel) — identisch zum PDF-Renderer.
  const { title, subtitle } = splitCoverTitle(rawTitle, rawSubtitle);
  const { position, tone, surface, align, size: sizeKey, font, color } =
    parseCoverStyle(styleKey);
  const mainColor = main ?? NEUTRAL_MAIN;
  const accentRgb = accentColorFromMain(mainColor, tone);
  const titleCss = rgbCss(resolveTitleColor(color, tone, accentRgb));
  const authorCss = rgbCss(bandAuthorColor(tone));
  const accentCss = rgbCss(accentRgb);
  const atTop = position === "oben";
  const centered = align === "mitte";
  const overlayStyle =
    surface === "none"
      ? undefined
      : surface === "scrim"
        ? {
            backgroundImage: `linear-gradient(${atTop ? "to bottom" : "to top"}, ${rgbCss(scrimColor(mainColor, tone))} 0%, ${rgbCss(scrimColor(mainColor, tone))} 62%, transparent 100%)`,
          }
        : { backgroundColor: rgbCss(bandColorFromMain(mainColor, tone)) };
  const authorAtBottom = surface === "none" && atTop && Boolean(author);

  const words = title.split(/\s+/).filter(Boolean);
  // Bei frei gewählter Titelfarbe wird kein Wort zusätzlich eingefärbt —
  // sonst kämpfen zwei Farben im Titel.
  const accentIndex = color === "auto" ? pickAccentWordIndex(title) : -1;
  const titleType = titleScale(title.length, COVER_SIZE_FACTORS[sizeKey]);
  const fontClass = font === "grotesk" ? "font-display" : "font-cover-serif";

  return (
    <div
      className={`relative w-full overflow-hidden border border-border bg-muted shadow-sm [container-type:inline-size] ${
        rounded ? "rounded-xl" : ""
      } ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt={`Cover: ${title}`}
        className="aspect-[2/3] w-full object-cover"
      />
      <div
        className={`absolute inset-x-0 ${atTop ? "top-0" : "bottom-0"} ${
          surface === "none" ? "px-[7cqw]" : "px-[6cqw]"
        } ${centered ? "text-center" : ""} ${
          surface === "none"
            ? atTop
              ? "pt-[9cqw] pb-[4cqw]"
              : "pt-[4cqw] pb-[9cqw]"
            : surface === "scrim"
              ? atTop
                ? "pt-[4cqw] pb-[8cqw]"
                : "pt-[8cqw] pb-[3.5cqw]"
              : "pt-[4cqw] pb-[3.5cqw]"
        }`}
        style={overlayStyle}
      >
        {surface === "band" ? (
          <span
            className={`absolute inset-x-0 h-[0.5cqw] ${atTop ? "bottom-0" : "top-0"}`}
            style={{ backgroundColor: accentCss }}
          />
        ) : null}
        <p
          className={`${fontClass} font-bold`}
          style={{ color: titleCss, ...titleType }}
        >
          {words.map((word, i) => (
            <span
              key={i}
              style={i === accentIndex ? { color: accentCss } : undefined}
            >
              {word}
              {i < words.length - 1 ? " " : ""}
            </span>
          ))}
        </p>
        {subtitle ? (
          <p
            className="mt-[2cqw] font-medium leading-[3.9cqw] text-[3.1cqw]"
            style={{ color: authorCss }}
          >
            {subtitle}
          </p>
        ) : null}
        {author && !authorAtBottom ? (
          <p
            className={`mt-[3cqw] font-medium text-[2.9cqw] ${centered ? "uppercase tracking-[0.14em]" : ""}`}
            style={{ color: authorCss }}
          >
            {author}
          </p>
        ) : null}
      </div>
      {authorAtBottom ? (
        <p
          className={`absolute inset-x-0 bottom-[4cqw] px-[6cqw] font-medium text-[2.9cqw] ${
            centered ? "text-center uppercase tracking-[0.14em]" : ""
          }`}
          style={{ color: authorCss }}
        >
          {author}
        </p>
      ) : null}
    </div>
  );
}
