import { StatusBadge } from "@/components/buchwerk/status-badge";

// A lightweight, on-brand mock of the Buchwerk workspace — pure markup, no
// external image. Lets the landing page SHOW the product, not just describe it.
export function ProductPreview() {
  const chapters = [
    { n: "01", title: "Warum viele Hunde Autofahrten fürchten", state: "done" },
    { n: "02", title: "Den eigenen Hund lesen lernen", state: "done" },
    { n: "03", title: "Die richtige Ausrüstung", state: "draft" },
  ] as const;

  return (
    <div
      aria-hidden
      className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_24px_60px_-28px_rgba(23,20,15,0.35)]"
    >
      {/* Browser chrome */}
      <div className="flex items-center gap-2 border-b border-border bg-muted px-4 py-3">
        <span className="size-2.5 rounded-full bg-input" />
        <span className="size-2.5 rounded-full bg-input" />
        <span className="size-2.5 rounded-full bg-input" />
        <span className="ml-3 rounded-md border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
          buchwerk.info/projekte
        </span>
      </div>

      <div className="p-5 sm:p-6">
        <h3 className="font-display text-lg font-bold leading-tight text-foreground">
          Ruhig ans Ziel: Stressfrei mit dem Hund im Auto
        </h3>
        <div className="mt-3 flex items-center gap-3">
          <div className="h-2 w-40 overflow-hidden rounded-full bg-input">
            <div className="h-full w-[70%] rounded-full bg-primary" />
          </div>
          <span className="text-xs font-semibold text-primary">
            7 / 10 Kapitel
          </span>
        </div>

        <div className="mt-5 space-y-2.5">
          {chapters.map((c) => (
            <div
              key={c.n}
              className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
            >
              <span className="font-display text-xs font-bold text-muted-foreground">
                {c.n}
              </span>
              <span className="flex-1 truncate text-sm font-medium text-foreground">
                {c.title}
              </span>
              {c.state === "done" ? (
                <StatusBadge intent="done">✓ Fertig</StatusBadge>
              ) : (
                <StatusBadge intent="draft">Wird geschrieben…</StatusBadge>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
