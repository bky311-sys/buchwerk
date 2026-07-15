"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteProjectAction } from "@/lib/books/actions";

// Small inline "delete project" control for the project list. Works at any
// stage (also for unfinished books). Confirms first, since the whole book —
// chapters, cover, listing — is removed.
export function DeleteProjectButton({
  projectId,
  title,
  published = false,
}: {
  projectId: string;
  title: string;
  published?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onDelete() {
    // A published book still lives on Amazon, but deleting it here destroys the
    // manuscript source — so no more corrections or new editions are possible.
    // Warn much more explicitly in that case.
    const message = published
      ? `ACHTUNG: „${title}“ ist bei Amazon veröffentlicht.\n\nWenn du es hier löschst, verlierst du unwiderruflich das Manuskript, die Kapitel und das Cover — die Grundlage für Korrekturen und Neuauflagen. Das Buch bei Amazon bleibt bestehen, lässt sich aber aus Buchwerk nicht mehr überarbeiten.\n\nWirklich endgültig löschen?`
      : `„${title}“ wirklich löschen? Das Buch mit allen Kapiteln, Cover und Texten wird endgültig entfernt.`;
    const ok = window.confirm(message);
    if (!ok) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteProjectAction(projectId);
      if (result.ok) router.refresh();
      else setError(result.error ?? "Konnte nicht gelöscht werden.");
    });
  }

  return (
    <span className="inline-flex flex-col items-end">
      <button
        type="button"
        onClick={onDelete}
        disabled={isPending}
        className="text-xs font-medium text-muted-foreground underline underline-offset-4 hover:text-destructive disabled:opacity-50"
      >
        {isPending ? "Löschen…" : "Löschen"}
      </button>
      {error ? (
        <span role="alert" className="mt-1 text-xs text-destructive">
          {error}
        </span>
      ) : null}
    </span>
  );
}
