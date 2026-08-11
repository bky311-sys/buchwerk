"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/buchwerk/spinner";
import { GenerationPoller } from "@/components/buchwerk/generation-poller";
import type { MarketSnapshot } from "@/lib/books/market-check";

// Marktcheck auf der KDP-Seite: echte Amazon-Wettbewerber (Titel, Jahr, Preis,
// Bewertungen) + echte Suchvorschläge. Läuft VOR der Listing-Generierung —
// das Listing nutzt die Daten dann für Keywords und Preisempfehlung.
// Fire+Poll wie die anderen Flows.

export function MarketCheckPanel({
  projectId,
  snapshot,
  isRunning,
  hasFailed,
  hasListing = false,
  published = false,
}: {
  projectId: string;
  snapshot: MarketSnapshot | null;
  isRunning: boolean;
  hasFailed: boolean;
  hasListing?: boolean;
  published?: boolean;
}) {
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const running = isRunning || starting;

  async function start() {
    setError(null);
    setStarting(true);
    try {
      const res = await fetch(`/api/projekte/${projectId}/marktcheck`, {
        method: "POST",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(body?.error ?? "Der Marktcheck konnte nicht starten.");
        setStarting(false);
      }
    } catch {
      setError("Der Marktcheck konnte nicht starten.");
      setStarting(false);
    }
  }

  return (
    <div className="mt-6 rounded-2xl border border-border bg-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold tracking-tight">
          Marktcheck
        </h2>
        {snapshot ? (
          <span className="text-xs text-muted-foreground">
            Stand {snapshot.erstellt_am ? snapshot.erstellt_am.slice(0, 10) : "—"}
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Echte Amazon-Konkurrenz zu deinem Thema — Titel, Preise, Bewertungen und
        was Käufer wirklich suchen.{" "}
        {published
          ? "Dein Buch ist bereits veröffentlicht — nutze den Marktcheck, um Preis und Konkurrenz im Blick zu behalten."
          : hasListing
            ? "Dein Listing steht schon. Ein frischer Marktcheck lohnt sich, wenn du Keywords oder Preis noch einmal prüfen und das Listing neu generieren willst."
            : "Das Listing nutzt diese Daten für Keywords und Preisempfehlung: erst Marktcheck, dann Listing generieren."}
      </p>

      <GenerationPoller active={running} />

      {running ? (
        <p className="mt-4 flex items-center gap-2 text-sm font-medium text-clay-strong">
          <Spinner className="size-4" />
          Der Markt wird recherchiert… (~1 Minute)
        </p>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button
            type="button"
            onClick={start}
            variant={snapshot ? "outline" : "default"}
            size={snapshot ? "sm" : "lg"}
          >
            {snapshot ? "Marktcheck aktualisieren" : "Marktcheck starten"}
          </Button>
          {hasFailed && !snapshot ? (
            <p className="text-sm text-destructive">
              Der letzte Lauf ist fehlgeschlagen — versuch es noch einmal.
            </p>
          ) : null}
        </div>
      )}
      {error ? (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {snapshot && !running ? (
        <div className="mt-5 space-y-4">
          <p className="text-sm leading-relaxed">{snapshot.einordnung}</p>

          {snapshot.wettbewerber.length ? (
            <div>
              <h3 className="text-sm font-semibold">
                Wettbewerber ({snapshot.wettbewerber.length})
              </h3>
              <ul className="mt-2 space-y-1.5 text-sm">
                {(open
                  ? snapshot.wettbewerber
                  : snapshot.wettbewerber.slice(0, 4)
                ).map((w, i) => (
                  <li key={i} className="flex flex-wrap items-baseline gap-x-2">
                    <span className="font-medium">„{w.titel}“</span>
                    <span className="text-xs text-muted-foreground">
                      {[
                        w.autor,
                        w.jahr,
                        w.preis_eur !== null
                          ? `${w.preis_eur.toFixed(2).replace(".", ",")} €`
                          : null,
                        w.bewertungen !== null
                          ? `${w.bewertungen.toLocaleString("de-DE")} Bew.`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </li>
                ))}
              </ul>
              {snapshot.wettbewerber.length > 4 && !open ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-1"
                  onClick={() => setOpen(true)}
                >
                  Alle zeigen
                </Button>
              ) : null}
            </div>
          ) : null}

          {snapshot.suchvorschlaege.length ? (
            <div>
              <h3 className="text-sm font-semibold">
                Das suchen Käufer bei Amazon
              </h3>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {snapshot.suchvorschlaege.map((s) => (
                  <span
                    key={s}
                    className="rounded-full border border-border bg-muted px-2.5 py-1 text-xs"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {snapshot.titel_muster ? (
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">
                Titel-Muster der Nische:
              </span>{" "}
              {snapshot.titel_muster}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
