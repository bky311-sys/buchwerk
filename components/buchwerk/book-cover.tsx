import {
  parseCoverStyle,
  bandColorFromMain,
  bandTitleColor,
  bandAuthorColor,
  rgbCss,
} from "@/lib/books/cover-style";
import { getCoverMainColor } from "@/lib/books/cover-main-color";

// The real, composed front cover as shown to buyers: the Flux motif with the
// title band overlaid — matching the downloaded cover JPG pixel-proportionally.
// Async server component: it samples the motif colour itself.
//
// Layout uses container-query units (cqw = 1% of this element's width) so the
// exact same composition scales cleanly from the large detail hero down to a
// small list thumbnail — mirroring the canvas export in cover-studio (which
// composits on a 1600px-wide canvas: pad 96 ≈ 6cqw, title 84 ≈ 5.25cqw,
// line-height 104 ≈ 6.5cqw, an 8px ≈ 0.5cqw accent strip).
export async function BookCover({
  imageUrl,
  title,
  author,
  styleKey,
  className = "",
}: {
  imageUrl: string | null;
  title: string;
  author?: string | null;
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

  const { position, tone } = parseCoverStyle(styleKey);
  const main = await getCoverMainColor(imageUrl);
  const bandCss = rgbCss(bandColorFromMain(main, tone));
  const titleCss = rgbCss(bandTitleColor(tone));
  const authorCss = rgbCss(bandAuthorColor(tone));
  const atTop = position === "oben";

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
        className={`absolute inset-x-0 ${atTop ? "top-0" : "bottom-0"} px-[6cqw] pt-[4cqw] pb-[3.5cqw]`}
        style={{ backgroundColor: bandCss }}
      >
        {/* Accent strip on the band's inner edge (Buchwerk green), matching the
            8px strip in the exported cover. */}
        <span
          className={`absolute inset-x-0 h-[0.5cqw] bg-primary ${atTop ? "bottom-0" : "top-0"}`}
        />
        <p
          className="font-display font-bold leading-[6.5cqw] text-[5.25cqw]"
          style={{ color: titleCss }}
        >
          {title}
        </p>
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
