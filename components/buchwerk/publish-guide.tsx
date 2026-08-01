import Link from "next/link";
import { PublishChecklist } from "@/components/buchwerk/publish-checklist";

// The last mile: the app produces the building blocks, but the author uploads
// them to Amazon KDP themselves (Buchwerk is a tool, not a publisher). The guide
// mirrors Amazon's actual KDP setup — its three tabs (Details, Inhalt, Preise) —
// so every buchwerk asset maps 1:1 to a KDP field.
export function PublishGuide({
  projectId,
  finished,
  imprintComplete,
  hasListing,
  hasCover,
}: {
  projectId: string;
  finished: boolean;
  imprintComplete: boolean;
  hasListing: boolean;
  hasCover: boolean;
}) {
  const manuscriptReady = finished && imprintComplete;

  const assets: {
    label: string;
    href: string;
    done: boolean;
    download?: boolean;
  }[] = [
    { label: "KDP-Texte", href: `/projekte/${projectId}/kdp`, done: hasListing },
    { label: "Cover", href: `/projekte/${projectId}/cover`, done: hasCover },
    {
      label: "Manuskript-EPUB (eBook)",
      href: `/projekte/${projectId}/manuskript/epub`,
      done: manuscriptReady,
      download: true,
    },
    {
      label: "Manuskript-PDF (Print)",
      href: `/projekte/${projectId}/manuskript/pdf`,
      done: manuscriptReady,
      download: true,
    },
  ];

  return (
    <section className="rounded-2xl border border-border bg-card p-6 sm:p-7">
      <h2 className="font-display text-lg font-semibold">
        Bei Amazon veröffentlichen
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Dein Buch ist fertig. Buchwerk ist kein Verlag — du lädst es selbst bei
        Amazon KDP hoch und behältst alle Rechte und Einnahmen. Die Schritte
        folgen genau Amazons Ablauf.
      </p>

      <div className="mt-5">
        <p className="text-sm font-semibold text-foreground">Das brauchst du:</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {assets.map((a) =>
            a.done ? (
              a.download ? (
                <a
                  key={a.label}
                  href={a.href}
                  download
                  className="inline-flex items-center gap-1.5 rounded-full border border-success/40 bg-success-tint px-3 py-1.5 text-sm font-medium text-success"
                >
                  ✓ {a.label}
                </a>
              ) : (
                <Link
                  key={a.label}
                  href={a.href}
                  className="inline-flex items-center gap-1.5 rounded-full border border-success/40 bg-success-tint px-3 py-1.5 text-sm font-medium text-success"
                >
                  ✓ {a.label}
                </Link>
              )
            ) : (
              <Link
                key={a.label}
                href={a.href}
                className="inline-flex items-center rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"
              >
                {a.label} — offen
              </Link>
            ),
          )}
        </div>
        {!manuscriptReady ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Manuskript-Download erst, wenn alle Kapitel geschrieben und das
            Impressum ausgefüllt sind.
          </p>
        ) : null}
      </div>

      {/* Die 15 Schritte: einklappbar + abhakbar (Client, localStorage). */}
      <PublishChecklist projectId={projectId} />

      <p className="mt-5 text-xs text-muted-foreground">
        Tipp: Der Medienbruch bleibt, weil Amazon KDP keine Upload-Schnittstelle
        anbietet — du kopierst die Bausteine einmal selbst hinüber.
      </p>
    </section>
  );
}
