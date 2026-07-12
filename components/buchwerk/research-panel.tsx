"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/buchwerk/spinner";
import { StatusBadge } from "@/components/buchwerk/status-badge";

type Props = {
  projectId: string;
  research: string | null;
  // Live research state, derived from research_status by the parent.
  isGenerating: boolean;
  isStale: boolean;
};

export function ResearchPanel({
  projectId,
  research,
  isGenerating,
  isStale,
}: Props) {
  const router = useRouter();
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const busy = isGenerating || starting;
  const hasResearch = Boolean(research?.trim());

  async function run() {
    setError(null);
    setStarting(true);
    try {
      const res = await fetch(`/api/projekte/${projectId}/research`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(data?.error ?? "Die Recherche konnte nicht erstellt werden.");
      }
    } catch {
      // Dropped request — the "läuft" status keeps the spinner and the page
      // poller going until the dossier lands.
    } finally {
      router.refresh();
      setStarting(false);
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-6 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h2 className="font-display text-lg font-semibold">Recherche</h2>
          {isGenerating ? (
            <StatusBadge intent="draft">
              <Spinner className="size-3" />
              Läuft…
            </StatusBadge>
          ) : isStale ? (
            <StatusBadge intent="error">Fehlgeschlagen</StatusBadge>
          ) : hasResearch ? (
            <StatusBadge intent="done">✓ Fertig</StatusBadge>
          ) : (
            <StatusBadge intent="neutral">Offen</StatusBadge>
          )}
        </div>

        {isGenerating ? null : (
          <Button
            type="button"
            variant={hasResearch ? "outline" : "default"}
            size="sm"
            onClick={run}
            disabled={busy}
          >
            {hasResearch ? "Recherche neu erstellen" : "Recherche erstellen"}
          </Button>
        )}
      </div>

      {isGenerating ? (
        <div className="mt-4 flex items-center gap-2 text-sm font-medium text-clay-strong">
          <Spinner className="size-4" />
          Websuche läuft… (kann bis zu ~1 Min. dauern)
        </div>
      ) : hasResearch ? (
        <details className="mt-4 group">
          <summary className="cursor-pointer text-sm font-medium text-primary underline-offset-4 hover:underline">
            Dossier anzeigen
          </summary>
          <div className="mt-3 max-h-[28rem] overflow-y-auto rounded-lg border border-border bg-muted p-4 text-sm leading-relaxed whitespace-pre-wrap">
            {research}
          </div>
        </details>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">
          Buchwerk recherchiert dein Thema im Web und erstellt ein Dossier mit
          belegten Fakten, Zahlen und Quellen. Die Kapitel werden anschließend
          auf dieser Basis geschrieben — mach das{" "}
          <span className="font-medium text-foreground">
            vor dem Schreiben der Kapitel
          </span>
          .
        </p>
      )}

      {isStale && !isGenerating ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Der letzte Versuch wurde unterbrochen. Starte ihn einfach neu.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </section>
  );
}
