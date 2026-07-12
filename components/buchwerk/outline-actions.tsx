"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/buchwerk/spinner";
import { addChapterAction, type ActionResult } from "@/lib/books/actions";

type Props = {
  projectId: string;
  hasWrittenChapters: boolean;
  // Driven by the project status (refreshed by the poller): a new outline is
  // currently being generated.
  isRegenerating: boolean;
};

export function OutlineActions({
  projectId,
  hasWrittenChapters,
  isRegenerating,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const busy = isPending || starting || isRegenerating;

  function run(action: () => Promise<ActionResult>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        router.refresh();
      } else {
        setError(result.error ?? "Etwas ist schiefgelaufen.");
      }
    });
  }

  async function regenerate() {
    setError(null);
    setStarting(true);
    try {
      const res = await fetch(`/api/projekte/${projectId}/outline`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(data?.error ?? "Die Gliederung konnte nicht erstellt werden.");
      }
    } catch {
      // Dropped request — the "gliederung_läuft" status keeps the spinner and
      // the page poller going until the new outline lands.
    } finally {
      router.refresh();
      setStarting(false);
    }
  }

  function confirmRegenerate() {
    const message = hasWrittenChapters
      ? "Achtung: Das erstellt eine komplett neue Gliederung und löscht alle bereits geschriebenen Kapitel. Fortfahren?"
      : "Eine neue Gliederung vorschlagen lassen? Die aktuelle wird ersetzt.";
    if (window.confirm(message)) {
      regenerate();
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="lg"
          disabled={busy}
          onClick={() => run(() => addChapterAction(projectId))}
        >
          + Kapitel hinzufügen
        </Button>
        {isRegenerating || starting ? (
          <span className="inline-flex items-center gap-2 text-sm font-medium text-clay-strong">
            <Spinner className="size-4" />
            Neue Gliederung wird erstellt…
          </span>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="lg"
            disabled={busy}
            onClick={confirmRegenerate}
          >
            Gliederung neu vorschlagen
          </Button>
        )}
      </div>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
