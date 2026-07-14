import Link from "next/link";

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

  const groups: { title: string; steps: string[] }[] = [
    {
      title: "Anlegen",
      steps: [
        "Bei kdp.amazon.com anmelden (kostenloses Konto), dann „+ Neuen Titel erstellen“ → eBook wählen (Taschenbuch später genauso).",
      ],
    },
    {
      title: "Reiter „Details des Kindle eBooks“",
      steps: [
        "Sprache: Deutsch.",
        "Buchtitel und Untertitel aus deinen KDP-Texten einfügen.",
        "Autor: Vor- und Nachname getrennt eintragen (Amazon hat zwei Felder).",
        "Beschreibung: den Klappentext aus den KDP-Texten einfügen.",
        "Veröffentlichungsrechte: „Ich bin Inhaber des Urheberrechts …“.",
        "Primäres Publikum: sexuell explizit → Nein; Lesealter leer lassen.",
        "Kategorien: die 3 Kategorien aus deinen KDP-Texten im Kategorie-Picker auswählen (die jeweils passendste Entsprechung).",
        "Stichwörter: die 7 Keywords aus deinen KDP-Texten eintragen.",
      ],
    },
    {
      title: "Reiter „Inhalt des Kindle eBooks“",
      steps: [
        "Manuskript hochladen: EPUB für das eBook (reflowt sauber am Kindle).",
        "Cover: „Bereits vorhandenes Cover hochladen“ → dein Cover-Bild als JPG (KDP nimmt fürs Cover kein PDF).",
        "KI-generierter Inhalt: „Ja“ angeben — Amazon verlangt diese Kennzeichnung.",
      ],
    },
    {
      title: "Nur fürs Taschenbuch (Print)",
      steps: [
        "Als Format „5,50 × 8,50 Zoll (14,0 × 21,6 cm)“ wählen — genau darauf ist die Manuskript-PDF gesetzt.",
        "Als Buchinhalt die Manuskript-PDF hochladen (nicht die EPUB).",
      ],
    },
    {
      title: "Reiter „Preise“",
      steps: [
        "Preis festlegen (Empfehlung aus deinen KDP-Texten) und veröffentlichen. Fertig — nach bis zu 72 h ist dein Buch live.",
      ],
    },
  ];

  // Continuous numbering across the grouped steps.
  let n = 0;

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

      <div className="mt-6 space-y-5">
        {groups.map((group) => (
          <div key={group.title}>
            <p className="text-sm font-semibold text-foreground">
              {group.title}
            </p>
            <ol className="mt-2 space-y-2.5">
              {group.steps.map((step) => {
                n += 1;
                return (
                  <li key={step} className="flex gap-3 text-sm leading-relaxed">
                    <span className="font-display flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/12 text-xs font-bold text-primary tabular-nums">
                      {n}
                    </span>
                    <span className="text-foreground">{step}</span>
                  </li>
                );
              })}
            </ol>
          </div>
        ))}
      </div>

      <p className="mt-5 text-xs text-muted-foreground">
        Tipp: Der Medienbruch bleibt, weil Amazon KDP keine Upload-Schnittstelle
        anbietet — du kopierst die Bausteine einmal selbst hinüber.
      </p>
    </section>
  );
}
