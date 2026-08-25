import { StatusBadge } from "@/components/buchwerk/status-badge";

// On-brand mock of a FINISHED Buchwerk project — pure markup, no external
// image. Zeigt das Ergebnis, nicht den Weg: Ein halbfertiger Workflow-Zustand
// („Wird geschrieben…") irritierte neue Besucher und verkaufte nichts
// (Benjamins Feedback 25.08.). Die Karte zeigt jetzt, was der Kunde am Ende
// in der Hand hat — passend zur Headline „recherchiert, druckfertig, live
// auf Amazon".
export function ProductPreview() {
  const deliverables = [
    {
      title: "Manuskript",
      detail: "10 Kapitel · 132 Seiten · PDF & EPUB",
    },
    {
      title: "Cover",
      detail: "Druckfertiges Full-Wrap für KDP",
    },
    {
      title: "Amazon-Listing",
      detail: "Titel, Beschreibung, Keywords, Kategorien",
    },
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
          Dein fertiges Buchprojekt
        </span>
        <span className="ml-auto rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
          Beispiel
        </span>
      </div>

      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-lg font-bold leading-tight text-foreground">
            Ruhig ans Ziel: Stressfrei mit dem Hund im Auto
          </h3>
          <StatusBadge intent="done">✓ Fertig</StatusBadge>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <div className="h-2 w-40 overflow-hidden rounded-full bg-input">
            <div className="h-full w-full rounded-full bg-primary" />
          </div>
          <span className="text-xs font-semibold text-primary">
            10 / 10 Kapitel
          </span>
        </div>

        <div className="mt-5 space-y-2.5">
          {deliverables.map((d) => (
            <div
              key={d.title}
              className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
            >
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-success-tint text-xs font-bold text-success">
                ✓
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium text-foreground">
                  {d.title}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {d.detail}
                </span>
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-xl bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground">
          Bereit für Amazon KDP
        </div>
      </div>
    </div>
  );
}
