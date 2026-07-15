import { NEUTRAL_MAIN, rgbCss, type RGB } from "@/lib/books/cover-style";
import { getCoverMainColor } from "@/lib/books/cover-main-color";

// The composed BACK cover, mirroring what the print cover PDF draws on the left
// panel (app/(app)/projekte/[id]/cover/pdf/route.ts): the motif's dominant colour
// as background, title + blurb on top, text colour picked by luminance.
//
// Deliberately WITHOUT the KDP barcode cut-out. That white 2"×1.2" box exists so
// Amazon can print a barcode onto it — on screen it is not part of the design,
// it would just read as a rendering bug. The PDF keeps it; the shop does not.
//
// Like BookCover this uses container-query units (cqw) so the composition scales
// with whatever width it is given.

function textColors(main: RGB): { title: string; body: string } {
  const luminance = 0.299 * main.r + 0.587 * main.g + 0.114 * main.b;
  const darkBg = luminance < 0.5;
  return darkBg
    ? { title: rgbCss({ r: 0.97, g: 0.97, b: 0.97 }), body: rgbCss({ r: 0.86, g: 0.86, b: 0.86 }) }
    : { title: rgbCss({ r: 0.12, g: 0.12, b: 0.12 }), body: rgbCss({ r: 0.28, g: 0.28, b: 0.28 }) };
}

export async function BookBackCover({
  imageUrl,
  title,
  blurb,
  className = "",
}: {
  imageUrl: string | null;
  title: string;
  blurb?: string | null;
  className?: string;
}) {
  const main = imageUrl ? await getCoverMainColor(imageUrl) : NEUTRAL_MAIN;
  const { title: titleCss, body: bodyCss } = textColors(main);

  // The container-query context and the cqw consumers must be DIFFERENT elements:
  // an element cannot query itself. Putting [container-type:inline-size] and
  // p-[8cqw] on the same div made the padding resolve against the viewport
  // instead (~125px per side on a 240px column) — the text was squeezed to zero
  // width and the box blew past its column. Root = container, inner = consumer,
  // same split BookCover uses.
  return (
    <div
      className={`aspect-[2/3] w-full overflow-hidden rounded-xl border border-border shadow-sm [container-type:inline-size] ${className}`}
      style={{ backgroundColor: rgbCss(main) }}
    >
      <div className="flex h-full flex-col p-[8cqw]">
        <p
          className="font-display font-bold leading-[4.4cqw] text-[3.6cqw]"
          style={{ color: titleCss }}
        >
          {title}
        </p>
        {blurb ? (
          <p
            className="mt-[4cqw] whitespace-pre-wrap leading-[3.4cqw] text-[2.5cqw]"
            style={{ color: bodyCss }}
          >
            {blurb}
          </p>
        ) : null}
      </div>
    </div>
  );
}
