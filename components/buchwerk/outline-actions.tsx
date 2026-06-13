"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  addChapterAction,
  regenerateOutlineAction,
  type ActionResult,
} from "@/lib/books/actions";

type Props = {
  projectId: string;
  hasWrittenChapters: boolean;
};

export function OutlineActions({ projectId, hasWrittenChapters }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

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

  function confirmRegenerate() {
    const message = hasWrittenChapters
      ? "Achtung: Das erstellt eine komplett neue Gliederung und löscht alle bereits geschriebenen Kapitel. Fortfahren?"
      : "Eine neue Gliederung vorschlagen lassen? Die aktuelle wird ersetzt.";
    if (window.confirm(message)) {
      run(() => regenerateOutlineAction(projectId));
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="lg"
          disabled={isPending}
          onClick={() => run(() => addChapterAction(projectId))}
        >
          + Kapitel hinzufügen
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="lg"
          disabled={isPending}
          onClick={confirmRegenerate}
        >
          {isPending ? "Wird erstellt…" : "Gliederung neu vorschlagen"}
        </Button>
      </div>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
