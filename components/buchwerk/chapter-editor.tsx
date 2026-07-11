"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  updateChapterAction,
  deleteChapterAction,
  moveChapterAction,
  type ActionResult,
} from "@/lib/books/actions";
import { StatusBadge } from "@/components/buchwerk/status-badge";

type Props = {
  chapterId: string;
  number: number;
  heading: string;
  summary: string;
  status: string;
  isFirst: boolean;
  isLast: boolean;
  hasContent: boolean;
};

export function ChapterEditor({
  chapterId,
  number,
  heading,
  summary,
  status,
  isFirst,
  isLast,
  hasContent,
}: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [headingValue, setHeadingValue] = useState(heading);
  const [summaryValue, setSummaryValue] = useState(summary);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(action: () => Promise<ActionResult>, closeEditor = false) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        if (closeEditor) setEditing(false);
        router.refresh();
      } else {
        setError(result.error ?? "Etwas ist schiefgelaufen.");
      }
    });
  }

  function confirmDelete() {
    const message = hasContent
      ? "Dieses Kapitel hat bereits Text. Wirklich löschen? Der geschriebene Text geht dabei verloren."
      : "Dieses Kapitel wirklich löschen?";
    if (window.confirm(message)) {
      run(() => deleteChapterAction(chapterId));
    }
  }

  return (
    <header className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="font-display text-sm font-bold text-muted-foreground tabular-nums">
            {String(number).padStart(2, "0")}
          </span>
          {status === "fertig" && hasContent ? (
            <StatusBadge intent="done">✓ Fertig</StatusBadge>
          ) : hasContent ? (
            <StatusBadge intent="draft">Entwurf</StatusBadge>
          ) : (
            <StatusBadge intent="neutral">Offen</StatusBadge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isPending || isFirst}
            onClick={() => run(() => moveChapterAction(chapterId, "up"))}
            aria-label="Kapitel nach oben"
          >
            ↑
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isPending || isLast}
            onClick={() => run(() => moveChapterAction(chapterId, "down"))}
            aria-label="Kapitel nach unten"
          >
            ↓
          </Button>
          {!editing ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isPending}
              onClick={() => {
                setHeadingValue(heading);
                setSummaryValue(summary);
                setError(null);
                setEditing(true);
              }}
            >
              Bearbeiten
            </Button>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isPending}
            onClick={confirmDelete}
          >
            Löschen
          </Button>
        </div>
      </div>

      {editing ? (
        <div className="space-y-3 rounded-lg border border-border bg-muted p-4">
          <div className="space-y-1">
            <Label htmlFor={`heading-${chapterId}`}>Überschrift</Label>
            <Input
              id={`heading-${chapterId}`}
              value={headingValue}
              onChange={(event) => setHeadingValue(event.target.value)}
              disabled={isPending}
              className="h-10"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`summary-${chapterId}`}>Kurzbeschreibung</Label>
            <textarea
              id={`summary-${chapterId}`}
              value={summaryValue}
              onChange={(event) => setSummaryValue(event.target.value)}
              disabled={isPending}
              rows={2}
              className="flex w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              disabled={isPending}
              onClick={() =>
                run(
                  () =>
                    updateChapterAction(chapterId, headingValue, summaryValue),
                  true,
                )
              }
            >
              {isPending ? "Speichern…" : "Speichern"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isPending}
              onClick={() => {
                setEditing(false);
                setError(null);
              }}
            >
              Abbrechen
            </Button>
          </div>
        </div>
      ) : (
        <>
          <h2 className="font-display text-xl font-semibold tracking-tight">
            {heading}
          </h2>
          {summary ? (
            <p className="text-sm text-muted-foreground">{summary}</p>
          ) : null}
        </>
      )}

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </header>
  );
}
