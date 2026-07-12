"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/buchwerk/spinner";
import { addChapterAction } from "@/lib/books/actions";

type Props = {
  projectId: string;
  hasWrittenChapters: boolean;
  // Driven by the project status (refreshed by the poller): a new outline is
  // currently being generated.
  isRegenerating: boolean;
};

const TEXTAREA_CLASS =
  "flex w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50";

export function OutlineActions({
  projectId,
  hasWrittenChapters,
  isRegenerating,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New-chapter form: we ask for heading + topic so the AI knows what to write.
  const [adding, setAdding] = useState(false);
  const [heading, setHeading] = useState("");
  const [summary, setSummary] = useState("");

  const busy = isPending || starting || isRegenerating;

  function addChapter() {
    setError(null);
    startTransition(async () => {
      const result = await addChapterAction(projectId, heading, summary);
      if (result.ok) {
        setAdding(false);
        setHeading("");
        setSummary("");
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
    <div className="space-y-3">
      {adding ? (
        <div className="space-y-3 rounded-lg border border-border bg-muted p-4">
          <p className="text-sm font-semibold text-foreground">
            Neues Kapitel
          </p>
          <div className="space-y-1">
            <Label htmlFor="new-heading">Überschrift</Label>
            <Input
              id="new-heading"
              value={heading}
              onChange={(e) => setHeading(e.target.value)}
              disabled={busy}
              placeholder="z. B. Die richtige Ausrüstung"
              className="h-10"
              autoFocus
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="new-summary">Worum geht es in diesem Kapitel?</Label>
            <textarea
              id="new-summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              disabled={busy}
              rows={2}
              placeholder="Kurz beschreiben, was die KI in diesem Kapitel behandeln soll."
              className={TEXTAREA_CLASS}
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              onClick={addChapter}
              disabled={busy || !heading.trim()}
            >
              {isPending ? "Wird hinzugefügt…" : "Kapitel hinzufügen"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() => {
                setAdding(false);
                setError(null);
              }}
            >
              Abbrechen
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={busy}
            onClick={() => {
              setError(null);
              setAdding(true);
            }}
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
      )}
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
