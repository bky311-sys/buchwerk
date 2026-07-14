"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createNewEditionAction } from "@/lib/books/actions";

// Creates a new edition of a published (locked) book. The clone starts as a
// fresh, not-yet-unlocked project — so it counts as its own book in the budget.
export function NewEditionButton({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onCreate() {
    const ok = window.confirm(
      "Eine Neuauflage ist ein eigenständiges neues Buch (mit kopiertem Inhalt als Startpunkt) und zählt als eigenes Buch. Jetzt erstellen?",
    );
    if (!ok) return;
    setError(null);
    startTransition(async () => {
      const result = await createNewEditionAction(projectId);
      if (result.ok && result.newId) {
        router.push(`/projekte/${result.newId}`);
      } else {
        setError(result.error ?? "Konnte nicht erstellt werden.");
      }
    });
  }

  return (
    <div>
      <Button type="button" onClick={onCreate} disabled={isPending}>
        {isPending ? "Neuauflage wird erstellt…" : "Neuauflage erstellen"}
      </Button>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
