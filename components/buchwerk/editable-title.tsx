"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateProjectTitleAction } from "@/lib/books/actions";

type Props = { projectId: string; title: string };

export function EditableTitle({ projectId, title }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(title);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await updateProjectTitleAction(projectId, value);
      if (result.ok) {
        setEditing(false);
        router.refresh();
      } else {
        setError(result.error ?? "Etwas ist schiefgelaufen.");
      }
    });
  }

  if (!editing) {
    return (
      <div className="flex flex-wrap items-start gap-x-3 gap-y-1">
        <h1 className="text-3xl font-medium tracking-tight sm:text-4xl">
          {title}
        </h1>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setValue(title);
            setError(null);
            setEditing(true);
          }}
        >
          Titel ändern
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        disabled={isPending}
        className="h-11 text-lg"
        aria-label="Buchtitel"
      />
      <div className="flex gap-2">
        <Button type="button" size="sm" onClick={save} disabled={isPending}>
          {isPending ? "Speichern…" : "Speichern"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setEditing(false);
            setError(null);
          }}
          disabled={isPending}
        >
          Abbrechen
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
