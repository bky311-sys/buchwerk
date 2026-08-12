import type { BookMetricsSummary } from "@/lib/books/amazon-metrics";

// „Dein Buch bei Amazon" — das Erfolgs-Dashboard im Projekt-Hub veröffentlichter
// Bücher (Maßnahmenplan 12.08.). Die Daten sammelt der tägliche Cron in
// book_metrics; hier werden sie dem Autor gezeigt, damit unser Wert nicht beim
// KDP-Upload endet. Reine Server-Komponente, Sparkline als Inline-SVG.
//
// Ehrlich mit Lücken: Amazon blockiert Datacenter-Abrufe nach Laune — ein
// blockierter Tag ist eine Lücke, kein Fehler, und wird genau so erklärt.

function formatNumber(n: number): string {
  return n.toLocaleString("de-DE");
}

function Sparkline({ history }: { history: { bsr: number }[] }) {
  if (history.length < 2) return null;
  const values = history.map((h) => h.bsr);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const width = 100;
  const height = 28;
  // Niedriger Rang = besser = oben. 2px Innenabstand, damit die Linie nicht
  // an den Kanten klebt.
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * (width - 4) + 2;
      const y = ((v - min) / span) * (height - 4) + 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="h-10 w-full"
      role="img"
      aria-label="Verlauf des Bestseller-Rangs"
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        className="text-primary"
      />
    </svg>
  );
}

export function BookMetricsPanel({
  summary,
}: {
  summary: BookMetricsSummary;
}) {
  const { latest, deltaBsr, newRatings, history, lastAttemptBlocked } = summary;

  if (!latest) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-sm font-semibold">Dein Buch bei Amazon</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {lastAttemptBlocked
            ? "Amazon hat die letzten Abrufe blockiert — das passiert und legt sich meist von selbst. Wir versuchen es jede Nacht erneut."
            : "Noch keine Messung — heute Nacht schaut Buchwerk zum ersten Mal nach Rang, Bewertungen und Preis deines Buchs."}
        </p>
      </div>
    );
  }

  const stats: { label: string; value: string; hint: string | null }[] = [
    {
      label: "Bestseller-Rang",
      value: latest.bsr !== null ? `Nr. ${formatNumber(latest.bsr)}` : "—",
      hint:
        deltaBsr !== null && deltaBsr !== 0
          ? deltaBsr < 0
            ? `▲ ${formatNumber(Math.abs(deltaBsr))} Plätze besser (30 Tage)`
            : `▼ ${formatNumber(deltaBsr)} Plätze schlechter (30 Tage)`
          : null,
    },
    {
      label: "Bewertungen",
      value:
        latest.ratingsCount !== null ? formatNumber(latest.ratingsCount) : "—",
      hint:
        newRatings !== null && newRatings > 0
          ? `+${formatNumber(newRatings)} neu (30 Tage)`
          : null,
    },
    {
      label: "Ø Sterne",
      value:
        latest.rating !== null
          ? latest.rating.toLocaleString("de-DE", {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            })
          : "—",
      hint: null,
    },
    {
      label: "Preis",
      value:
        latest.priceEur !== null
          ? `${latest.priceEur.toLocaleString("de-DE", {
              minimumFractionDigits: 2,
            })} €`
          : "—",
      hint: null,
    },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-semibold">Dein Buch bei Amazon</p>
        <p className="text-xs text-muted-foreground">
          Stand {new Date(latest.capturedAt).toLocaleDateString("de-DE")}
          {lastAttemptBlocked ? " · letzter Abruf blockiert" : ""}
        </p>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="min-w-0">
            <dt className="text-xs text-muted-foreground">{stat.label}</dt>
            <dd className="mt-0.5 text-lg font-semibold tabular-nums">
              {stat.value}
            </dd>
            {stat.hint ? (
              <dd className="text-xs text-muted-foreground">{stat.hint}</dd>
            ) : null}
          </div>
        ))}
      </dl>

      {history.length >= 2 ? (
        <div className="mt-3">
          <Sparkline history={history} />
          <p className="mt-1 text-xs text-muted-foreground">
            Bestseller-Rang der letzten 30 Tage — oben ist besser. Buchwerk
            misst jede Nacht.
          </p>
        </div>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">
          Der Verlauf erscheint, sobald ein paar Nächte Messdaten
          zusammengekommen sind.
        </p>
      )}
    </div>
  );
}
