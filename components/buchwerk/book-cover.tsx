import {
  parseCoverStyle,
  bandColorFromMain,
  bandTitleColor,
  bandAuthorColor,
  rgbCss,
} from "@/lib/books/cover-style";
import { getCoverMainColor } from "@/lib/books/cover-main-color";

// The real, composed front cover as shown to buyers: the Flux motif with the
// title band overlaid (position + tone from cover_title_style, band colour
// derived from the motif) — matching the downloaded cover. Async server
// component: it samples the motif colour itself.
//
// `size` scales the band typography: "lg" for the detail hero, "sm" for list
// thumbnails.
export async function BookCover({
  imageUrl,
  title,
  author,
  styleKey,
  size = "lg",
  className = "",
}: {
  imageUrl: string | null;
  title: string;
  author?: string | null;
  styleKey?: string | null;
  size?: "lg" | "sm";
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

  const { position, tone } = parseCoverStyle(styleKey);
  const main = await getCoverMainColor(imageUrl);
  const bandCss = rgbCss(bandColorFromMain(main, tone));
  const titleCss = rgbCss(bandTitleColor(tone));
  const authorCss = rgbCss(bandAuthorColor(tone));

  const titleClass =
    size === "lg"
      ? "font-display font-bold leading-tight text-[clamp(0.9rem,3.2cqw,1.6rem)]"
      : "font-display font-bold leading-tight text-[11px]";
  const authorClass =
    size === "lg"
      ? "mt-1 font-medium text-[clamp(0.6rem,2cqw,0.95rem)]"
      : "mt-0.5 text-[9px]";
  const pad = size === "lg" ? "px-4 py-4" : "px-2 py-2";

  return (
    <div
      className={`relative w-full overflow-hidden rounded-xl border border-border bg-muted shadow-sm ${className}`}
      style={{ containerType: "inline-size" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt={`Cover: ${title}`}
        className="aspect-[2/3] w-full object-cover"
      />
      <div
        className={`absolute inset-x-0 ${pad} ${position === "oben" ? "top-0" : "bottom-0"}`}
        style={{ backgroundColor: bandCss }}
      >
        <p className={titleClass} style={{ color: titleCss }}>
          {title}
        </p>
        {author ? (
          <p className={authorClass} style={{ color: authorCss }}>
            {author}
          </p>
        ) : null}
      </div>
    </div>
  );
}
