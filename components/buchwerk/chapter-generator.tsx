"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/buchwerk/spinner";

type Props = {
  chapterId: string;
  hasContent: boolean;
  // Driven by the chapter's DB status (refreshed by the poller): the model call
  // for this chapter is currently running.
  isGenerating: boolean;
  // The previous run got stuck (function killed before it could finish).
  isStale: boolean;
  // This generation will run the web research first (only the first chapter of a
  // book without a dossier), so it takes noticeably longer.
  willResearch: boolean;
};

export function ChapterGenerator({
  chapterId,
  hasContent,
  isGenerating,
  isStale,
  willResearch,
}: Props) {
  const router = useRouter();
  const [starting, setStarting] = useState(false);
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
      // The request was dropped (e.g. a long generation past the gateway
      // limit). The server keeps writing and the poller picks up the result
      // from the DB status — so no error, just let the refresh below take over.
    } finally {
      // Whatever happened, re-read the DB: on success the content appears, on a
      // drop the "schreiben" status keeps the spinner + poller going, on an
      // error the status flips to "fehler" and the retry button shows.
      router.refresh();
      setStarting(false);
    }
  }

  if (busy) {
    return (
      <div className="flex items-center gap-2 text-sm font-medium text-clay-strong">
        <Spinner className="size-4" />
        {willResearch
          ? "Die KI recherchiert dafür zuerst im Web — das dauert einmalig ~1–2 Min., danach geht es schnell."
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
