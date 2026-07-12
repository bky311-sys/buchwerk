import Link from "next/link";
import { Button } from "@/components/ui/button";

// The last mile: the app produces the building blocks, but the author uploads
// them to Amazon KDP themselves (Buchwerk is a tool, not a publisher). This
// checklist closes that loop so nobody is left stranded at the finish.
export function PublishGuide({
  projectId,
  finished,
  imprintComplete,
}: {
  projectId: string;
  finished: boolean;
  imprintComplete: boolean;
}) {
  const steps = [
    "Melde dich bei kdp.amazon.com an (kostenloses Amazon-KDP-Konto).",
    "Klick auf „+ Neuen Titel erstellen“ und wähle eBook (oder Taschenbuch).",
    "Füge Titel, Untertitel, Beschreibung, die 7 Keywords und die Kategorien aus deinem KDP-Listing ein — alles kopierfertig.",
    "Lade dein Manuskript als Buchinhalt hoch — EPUB für das eBook (reflowt sauber am Kindle), PDF für das Taschenbuch.",
    "Lade dein Cover hoch (Cover-PDF bzw. das gewählte Cover-Bild).",
    "Bei der Frage nach KI-Inhalten „Ja“ angeben — Amazon verlangt diese Kennzeichnung.",
    "Preis festlegen und veröffentlichen. Fertig — dein Buch ist live bei Amazon.",
  ];

  return (
    <section className="rounded-2xl border border-border bg-card p-6 sm:p-7">
      <h2 className="font-display text-lg font-semibold">
        Bei Amazon veröffentlichen
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Dein Buch ist fertig. Buchwerk ist kein Verlag — du lädst es in wenigen
        Minuten selbst bei Amazon KDP hoch und behältst alle Rechte und
        Einnahmen. So geht&apos;s:
      </p>

      <div className="mt-5">
        <p className="text-sm font-semibold text-foreground">Das brauchst du:</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/projekte/${projectId}/kdp`}>KDP-Texte</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/projekte/${projectId}/cover`}>Cover</Link>
          </Button>
          {finished && imprintComplete ? (
            <>
              <Button asChild variant="outline" size="sm">
                <a href={`/projekte/${projectId}/manuskript/epub`} download>
                  Manuskript-EPUB (eBook)
                </a>
              </Button>
              <Button asChild variant="outline" size="sm">
                <a href={`/projekte/${projectId}/manuskript/pdf`} download>
                  Manuskript-PDF (Print)
                </a>
              </Button>
            </>
          ) : finished ? (
            <Button asChild variant="outline" size="sm">
              <Link href="#impressum">Impressum ausfüllen</Link>
            </Button>
          ) : (
            <span className="inline-flex items-center text-xs text-muted-foreground">
              Manuskript: erst wenn alle Kapitel fertig sind
            </span>
          )}
        </div>
      </div>

      <ol className="mt-6 space-y-3">
        {steps.map((step, index) => (
          <li key={step} className="flex gap-3 text-sm leading-relaxed">
            <span className="font-display flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/12 text-xs font-bold text-primary tabular-nums">
              {index + 1}
            </span>
            <span className="text-foreground">{step}</span>
          </li>
        ))}
      </ol>

      <p className="mt-5 text-xs text-muted-foreground">
        Tipp: Der Medienbruch bleibt, weil Amazon KDP keine Schnittstelle für
        Uploads anbietet — deshalb kopierst du die Bausteine einmal selbst
        hinüber.
      </p>
    </section>
  );
}
