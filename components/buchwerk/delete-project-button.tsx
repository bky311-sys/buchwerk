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
}: {
  projectId: string;
  title: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onDelete() {
    const ok = window.confirm(
      `„${title}“ wirklich löschen? Das Buch mit allen Kapiteln, Cover und Texten wird endgültig entfernt.`,
    );
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
