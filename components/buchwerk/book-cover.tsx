import {
  parseCoverStyle,
  bandColorFromMain,
  bandTitleColor,
  bandAuthorColor,
  rgbCss,
} from "@/lib/books/cover-style";
import {
  accentColorFromMain,
  pickAccentWordIndex,
  scrimColor,
} from "@/lib/books/cover-layout";
import { getCoverMainColor } from "@/lib/books/cover-main-color";

// The real, composed front cover as shown to buyers: the Flux motif with the
// title treatment overlaid — matching the downloaded cover JPG proportionally.
// Async server component: it samples the motif colour itself.
//
// Cover 2.0 (14.08., Marketing-Umbau): adaptive Titelgröße nach Titellänge
// (Amazon-Thumbnail-Regel: so groß wie möglich), ein hervorgehobenes
// Schlüsselwort in der Kontrast-Akzentfarbe, optionaler Untertitel, und neben
// dem deckenden Band die Scrim-Variante (Verlauf, Motiv bleibt sichtbar).
//
// Layout uses container-query units (cqw = 1% of this element's width) so the
// exact same composition scales cleanly from the large detail hero down to a
// small list thumbnail — mirroring the canvas export in cover-studio.

// cqw-Stufen zur Titellänge — muss dem Canvas-Export gefühlt entsprechen
// (dort misst fitTitle echt; hier im Server-HTML geht nur die Längen-Stufe).
function titleScale(len: number): { size: string; lh: string } {
  if (len <= 18) return { size: "text-[9cqw]", lh: "leading-[10.6cqw]" };
  if (len <= 32) return { size: "text-[7.5cqw]", lh: "leading-[8.9cqw]" };
  if (len <= 52) return { size: "text-[6.25cqw]", lh: "leading-[7.4cqw]" };
  if (len <= 80) return { size: "text-[5.25cqw]", lh: "leading-[6.3cqw]" };
  return { size: "text-[4.5cqw]", lh: "leading-[5.5cqw]" };
}

export async function BookCover({
  imageUrl,
  title,
  author,
  subtitle,
  styleKey,
  className = "",
}: {
  imageUrl: string | null;
  title: string;
  author?: string | null;
  subtitle?: string | null;
  styleKey?: string | null;
  className?: string;
}) {
  if (!imageUrl) {
    return (
      <div
        className={`flex aspect-[2/3] w-full items-center justify-center rounded-xl border border-border bg-muted p-4 text-center ${className}`}
      >
        <span className="font-display text-sm font-semibold text-muted-foreground">
          {title}
        </span>
      </div>
    );
  }

  const { position, tone, surface } = parseCoverStyle(styleKey);
  const main = await getCoverMainColor(imageUrl);
  const titleCss = rgbCss(bandTitleColor(tone));
  const authorCss = rgbCss(bandAuthorColor(tone));
  const accentCss = rgbCss(accentColorFromMain(main, tone));
  const atTop = position === "oben";

  const overlayStyle =
    surface === "scrim"
      ? {
          backgroundImage: `linear-gradient(${atTop ? "to bottom" : "to top"}, ${rgbCss(scrimColor(main, tone))} 0%, ${rgbCss(scrimColor(main, tone))} 62%, transparent 100%)`,
        }
      : { backgroundColor: rgbCss(bandColorFromMain(main, tone)) };

  const words = title.split(/\s+/).filter(Boolean);
  const accentIndex = pickAccentWordIndex(title);
  const { size, lh } = titleScale(title.length);

  return (
    <div
      className={`relative w-full overflow-hidden rounded-xl border border-border bg-muted shadow-sm [container-type:inline-size] ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt={`Cover: ${title}`}
        className="aspect-[2/3] w-full object-cover"
      />
      <div
        className={`absolute inset-x-0 ${atTop ? "top-0" : "bottom-0"} px-[6cqw] ${
          surface === "scrim"
            ? atTop
              ? "pt-[4cqw] pb-[8cqw]"
              : "pt-[8cqw] pb-[3.5cqw]"
            : "pt-[4cqw] pb-[3.5cqw]"
        }`}
        style={overlayStyle}
      >
        {/* Accent strip on the inner edge — in der Kontrast-Akzentfarbe des
            Motivs (Komplementär), nicht mehr fix im Buchwerk-Grün. */}
        {surface === "band" ? (
          <span
            className={`absolute inset-x-0 h-[0.5cqw] ${atTop ? "bottom-0" : "top-0"}`}
            style={{ backgroundColor: accentCss }}
          />
        ) : null}
        <p
          className={`font-display font-bold ${size} ${lh}`}
          style={{ color: titleCss }}
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
        {author ? (
          <p
            className="mt-[3cqw] font-medium text-[2.9cqw]"
            style={{ color: authorCss }}
          >
            {author}
          </p>
        ) : null}
      </div>
    </div>
  );
}
