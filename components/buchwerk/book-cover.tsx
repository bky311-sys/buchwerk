import { CoverComposition } from "@/components/buchwerk/cover-composition";
import { getCoverMainColor } from "@/lib/books/cover-main-color";

// The real, composed front cover as shown to buyers. Async server component:
// samples the motif colour, then renders the shared CoverComposition — the
// exact same markup the cover studio shows as live preview (Cover 2.2), so
// shop, studio and export can never drift apart.
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

  const main = await getCoverMainColor(imageUrl);
  return (
    <CoverComposition
      imageUrl={imageUrl}
      title={title}
      author={author}
      subtitle={subtitle}
      styleKey={styleKey}
      main={main}
      className={className}
    />
  );
}
