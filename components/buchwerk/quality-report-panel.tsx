"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/buchwerk/spinner";
import { GenerationPoller } from "@/components/buchwerk/generation-poller";
import { StatusBadge } from "@/components/buchwerk/status-badge";
import type {
  QualityFinding,
  QualityReport,
} from "@/lib/books/quality-report";

// Qualitätsbericht auf der Veröffentlichen-Seite: prüft das komplette
// Manuskript (Wiederholungen, Widersprüche, Fakten, KI-Floskeln, Stil,
// Rechtschreibung) plus alle Quellen-Links, bevor der Autor exportiert.
// Fire+Poll wie Kapitel/Recherche: der Button feuert die Route, die Seite
// pollt den Status aus der DB.

const TYP_LABEL: Record<string, string> = {
  wiederholung: "Wiederholung",
  widerspruch: "Widerspruch",
  fakten: "Faktenlage",
  ki_floskel: "KI-Floskel",
  stil: "Stil",
  struktur: "Struktur",
  rechtschreibung: "Rechtschreibung",
};

const SCHWERE_STYLE: Record<QualityFinding["schwere"], string> = {
  hoch: "border-destructive/40 bg-destructive/5",
  mittel: "border-clay/40 bg-clay/5",
  niedrig: "border-border bg-card",
};

function scoreColor(score: number): string {
  if (score >= 90) return "text-success";
  if (score >= 75) return "text-primary";
  if (score >= 50) return "text-clay-strong";
  return "text-destructive";
}

export function QualityReportPanel({
  projectId,
  report,
  isRunning,
  hasFailed,
  revisionRunning = false,
  revisionNote = null,
}: {
  projectId: string;
  report: QualityReport | null;
  isRunning: boolean;
  hasFailed: boolean;
  /** Ein Überarbeitungslauf läuft serverseitig (Status aus der DB). */
  revisionRunning?: boolean;
  /** Kurzbilanz der letzten Überarbeitung. */
  revisionNote?: string | null;
}) {
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [revising, setRevising] = useState(false);
  const [revisionProgress, setRevisionProgress] = useState<string | null>(null);

  const running = isRunning || starting;
  const revisionActive = revising || revisionRunning;

  // Kapitel, für die es überhaupt automatisch behebbare Befunde gibt.
  const chaptersWithFindings = new Set(
    (report?.befunde ?? [])
      .map((b) => b.kapitel)
      .filter((k): k is number => typeof k === "number"),
  );

  // Überarbeitung: Die Route behandelt pro Aufruf wenige Kapitel (Zeitlimit),
  // also so lange erneut aufrufen, bis sie `done` meldet — wie beim
  // etappenweisen Recherche-Lauf.
  async function revise() {
    if (
      !window.confirm(
        `Alle Befunde in ${chaptersWithFindings.size} Kapiteln automatisch beheben? Die Kapiteltexte werden dabei überschrieben. Das dauert einige Minuten — lass den Tab so lange offen.`,
      )
    ) {
      return;
    }
    setError(null);
    setRevising(true);
    setRevisionProgress("Überarbeitung startet…");
    try {
      for (let round = 0; round < 12; round += 1) {
        const res = await fetch(`/api/projekte/${projectId}/revise`, {
          method: "POST",
        });
        const body = (await res.json().catch(() => null)) as {
          ok?: boolean;
          error?: string;
          revised?: number[];
          done?: boolean;
        } | null;
        if (!res.ok || !body?.ok) {
          setError(body?.error ?? "Die Überarbeitung ist fehlgeschlagen.");
          break;
        }
        if (body.done) {
          setRevisionProgress(
            "Fertig — erstelle den Bericht neu, um das Ergebnis zu sehen.",
          );
          break;
        }
        setRevisionProgress(
          `Kapitel ${(body.revised ?? []).join(", ")} überarbeitet — weiter…`,
        );
      }
    } catch {
      setError("Die Überarbeitung ist fehlgeschlagen.");
    } finally {
      setRevising(false);
    }
  }

  async function start() {
    setError(null);
    setStarting(true);
    try {
      const res = await fetch(`/api/projekte/${projectId}/qs`, {
        method: "POST",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(body?.error ?? "Der Qualitätsbericht konnte nicht starten.");
        setStarting(false);
      }
      // Erfolg: Poller unten zieht den neuen Status aus der DB; `starting`
      // bleibt true, bis die Seite mit quality_status="läuft" neu rendert.
    } catch {
      setError("Der Qualitätsbericht konnte nicht starten.");
      setStarting(false);
    }
  }

  const deadSources = report?.quellen.filter((q) => q.status === "tot") ?? [];
  const highCount =
    report?.befunde.filter((b) => b.schwere === "hoch").length ?? 0;
  const shown = showAll ? report?.befunde : report?.befunde.slice(0, 6);

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold tracking-tight">
          Qualitätsbericht
        </h2>
        {report ? (
          report.export_empfehlung === "ok" ? (
            <StatusBadge intent="done">✓ Bereit zur Veröffentlichung</StatusBadge>
          ) : report.export_empfehlung === "mit_einschraenkungen" ? (
            <StatusBadge intent="draft">Mit Einschränkungen</StatusBadge>
          ) : (
            <StatusBadge intent="error">Überarbeitung empfohlen</StatusBadge>
          )
        ) : null}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Ein strenger Lektorats-Durchgang über das ganze Buch: Wiederholungen
        zwischen Kapiteln, Widersprüche, Faktenlage, KI-Floskeln, Stil und
        Rechtschreibung — plus ein Link-Check aller Quellen.
      </p>

      <GenerationPoller active={running} />

      {running ? (
        <p className="mt-4 flex items-center gap-2 text-sm font-medium text-clay-strong">
          <Spinner className="size-4" />
          Das Manuskript wird geprüft… (1–2 Minuten)
        </p>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {/* Primäraktion ist die Überarbeitung, sobald es Befunde gibt —
              den Bericht nur zu lesen behebt nichts. */}
          {report && chaptersWithFindings.size > 0 ? (
            <Button
              type="button"
              onClick={revise}
              size="lg"
              disabled={revisionActive}
            >
              {revisionActive ? (
                <>
                  <Spinner className="size-4" />
                  Überarbeitung läuft…
                </>
              ) : (
                `Befunde automatisch beheben (${chaptersWithFindings.size} Kapitel)`
              )}
            </Button>
          ) : null}
          <Button
            type="button"
            onClick={start}
            size="lg"
            variant={
              report && chaptersWithFindings.size > 0 ? "outline" : "default"
            }
            disabled={revisionActive}
          >
            {report ? "Bericht neu erstellen" : "Qualitätsbericht erstellen"}
          </Button>
          {hasFailed && !report ? (
            <p className="text-sm text-destructive">
              Der letzte Lauf ist fehlgeschlagen — versuch es noch einmal.
            </p>
          ) : null}
        </div>
      )}
      {revisionActive || revisionProgress ? (
        <p className="mt-3 flex items-center gap-2 text-sm font-medium text-clay-strong">
          {revisionActive ? <Spinner className="size-4" /> : null}
          {revisionProgress ??
            "Die Kapitel werden anhand der Befunde überarbeitet…"}
        </p>
      ) : revisionNote ? (
        <p className="mt-3 text-sm text-muted-foreground">{revisionNote}</p>
      ) : null}
      <GenerationPoller active={revisionActive} />
      {revisionActive ? (
        <p className="mt-1 text-xs text-muted-foreground">
          Bitte den Tab offen lassen — pro Kapitel etwa eine Minute.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {report && !running ? (
        <div className="mt-6 space-y-5">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <span
              className={`text-3xl font-semibold tabular-nums ${scoreColor(report.score)}`}
            >
              {report.score}
              <span className="text-base font-normal text-muted-foreground">
                {" "}
                / 100
              </span>
            </span>
            {highCount > 0 ? (
              <span className="text-sm font-medium text-destructive">
                {highCount} schwerwiegende{highCount === 1 ? "r" : ""} Befund
                {highCount === 1 ? "" : "e"}
              </span>
            ) : null}
          </div>
          <p className="text-sm leading-relaxed">{report.urteil}</p>

          {report.befunde.length ? (
            <div>
              <h3 className="text-sm font-semibold">
                Befunde ({report.befunde.length})
              </h3>
              <ul className="mt-2 space-y-2">
                {(shown ?? []).map((b, i) => (
                  <li
                    key={i}
                    className={`rounded-xl border p-3 text-sm ${SCHWERE_STYLE[b.schwere]}`}
                  >
                    <p className="text-xs font-medium text-muted-foreground">
                      {b.kapitel ? `Kapitel ${b.kapitel} · ` : ""}
                      {TYP_LABEL[b.typ] ?? b.typ} · Schwere {b.schwere}
                    </p>
                    <p className="mt-1 leading-relaxed">{b.beschreibung}</p>
                    {b.zitat ? (
                      <p className="mt-1 text-xs italic text-muted-foreground">
                        „{b.zitat}“
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
              {report.befunde.length > 6 && !showAll ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={() => setShowAll(true)}
                >
                  Alle {report.befunde.length} Befunde zeigen
                </Button>
              ) : null}
              <p className="mt-3 text-xs text-muted-foreground">
                Zum Beheben: Kapitel im Schritt „Schreiben“ öffnen und mit „Mit
                KI überarbeiten“ gezielt korrigieren — oder den Text direkt
                bearbeiten.
              </p>
            </div>
          ) : (
            <p className="text-sm text-success">
              ✓ Keine inhaltlichen Befunde.
            </p>
          )}

          {report.quellen.length ? (
            <div>
              <h3 className="text-sm font-semibold">
                Quellen-Check ({report.quellen.length} Links)
              </h3>
              {deadSources.length ? (
                <>
                  <p className="mt-1 text-sm text-destructive">
                    {deadSources.length} Link{deadSources.length === 1 ? "" : "s"}{" "}
                    nicht erreichbar — vor der Veröffentlichung aus dem
                    jeweiligen Kapitel entfernen oder ersetzen:
                  </p>
                  <ul className="mt-2 space-y-1 text-sm">
                    {deadSources.map((q) => (
                      <li key={q.url} className="truncate">
                        <span className="font-medium">{q.title}</span>{" "}
                        <span className="text-xs text-muted-foreground">
                          {q.url}
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="mt-1 text-sm text-success">
                  ✓ Alle geprüften Quellen-Links erreichbar.
                </p>
              )}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
