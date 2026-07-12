"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/buchwerk/spinner";

type Props = {
  chapterId: string;
  projectId: string;
  hasContent: boolean;
  // Driven by the chapter's DB status (refreshed by the poller): the model call
  // for this chapter is currently running.
  isGenerating: boolean;
  // The previous run got stuck (function killed before it could finish).
  isStale: boolean;
  // Run the (decoupled) web research first, then write. Only enabled on a plan
  // with a raised function limit, and only for the first chapter of a book
  // without a dossier.
  willResearch: boolean;
};

export function ChapterGenerator({
  chapterId,
  projectId,
  hasContent,
  isGenerating,
  isStale,
  willResearch,
}: Props) {
  const router = useRouter();
  const [starting, setStarting] = useState(false);
  const [researching, setResearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const busy = isGenerating || starting;

  async function run() {
    // Overwriting an existing chapter (incl. manual/AI edits) is destructive —
    // confirm first.
    if (
      hasContent &&
      !window.confirm(
        "Dieses Kapitel neu schreiben? Der aktuelle Text wird ersetzt — auch deine Änderungen.",
      )
    ) {
      return;
    }
    setError(null);
    setStarting(true);
    try {
      // Research is a separate request (it takes minutes) so the chapter write
      // itself always stays well within the function limit and never aborts.
      if (willResearch) {
        setResearching(true);
        try {
          await fetch(`/api/projekte/${projectId}/research`, { method: "POST" });
        } catch {
          // best-effort — the chapter is still written without a dossier
        }
        setResearching(false);
        router.refresh();
      }
      const res = await fetch(`/api/chapters/${chapterId}/generate`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(data?.error ?? "Das Kapitel konnte nicht generiert werden.");
      }
    } catch {
      // The request was dropped — the server keeps writing and the poller picks
      // up the result from the DB status, so just let the refresh below run.
    } finally {
      router.refresh();
      setStarting(false);
      setResearching(false);
    }
  }

  if (busy) {
    return (
      <div className="flex items-center gap-2 text-sm font-medium text-clay-strong">
        <Spinner className="size-4" />
        {researching
          ? "Die KI recherchiert dein Thema im Web (~2–3 Min.)…"
          : "Wird geschrieben… (kann ~30 Sek. dauern)"}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant={hasContent ? "outline" : "default"}
        size="lg"
        onClick={run}
      >
        {isStale
          ? "Erneut versuchen"
          : hasContent
            ? "Kapitel neu schreiben"
            : "Kapitel schreiben"}
      </Button>
      {isStale ? (
        <p className="text-sm text-muted-foreground">
          Der letzte Versuch wurde unterbrochen. Starte ihn einfach neu.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
