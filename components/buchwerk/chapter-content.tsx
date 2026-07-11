"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  saveChapterContentAction,
  reviseChapterAction,
} from "@/lib/books/chapter-edit-actions";

const TEXTAREA_CLASS =
  "flex w-full rounded-xl border border-input bg-card px-4 py-3 text-base leading-relaxed outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50";

type Mode = "view" | "edit" | "revise";

export function ChapterContent({
  chapterId,
  content,
}: {
  chapterId: string;
  content: string;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("view");
  const [text, setText] = useState(content);
  const [instruction, setInstruction] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await saveChapterContentAction(chapterId, text);
      if (result.ok) {
        setMode("view");
        router.refresh();
      } else {
        setError(result.error ?? "Etwas ist schiefgelaufen.");
      }
    });
  }

  function revise() {
    setError(null);
    startTransition(async () => {
      const result = await reviseChapterAction(chapterId, instruction);
      if (result.ok) {
        setInstruction("");
        setMode("view");
        router.refresh();
      } else {
        setError(result.error ?? "Etwas ist schiefgelaufen.");
      }
    });
  }

  if (mode === "edit") {
    return (
      <div className="mt-5 space-y-3">
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          disabled={isPending}
          rows={18}
          className={TEXTAREA_CLASS}
        />
        <div className="flex gap-2">
          <Button type="button" size="sm" onClick={save} disabled={isPending}>
            {isPending ? "Speichern…" : "Speichern"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isPending}
            onClick={() => {
              setText(content);
              setMode("view");
              setError(null);
            }}
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

  return (
    <div className="mt-5">
      <div className="whitespace-pre-wrap text-base leading-relaxed">
        {content}
      </div>

      {mode === "revise" ? (
        <div className="mt-4 space-y-2 rounded-lg border border-border bg-muted p-4">
          <Input
            value={instruction}
            onChange={(event) => setInstruction(event.target.value)}
            disabled={isPending}
            placeholder="z. B. kürzer fassen, mehr Beispiele, lockererer Ton"
            className="h-10"
            aria-label="Anweisung zur Überarbeitung"
          />
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              onClick={revise}
              disabled={isPending || !instruction.trim()}
            >
              {isPending ? "Wird überarbeitet… (~30 Sek.)" : "Überarbeiten"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isPending}
              onClick={() => {
                setMode("view");
                setInstruction("");
                setError(null);
              }}
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
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setText(content);
              setMode("edit");
              setError(null);
            }}
          >
            Text bearbeiten
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setMode("revise");
              setError(null);
            }}
          >
            Mit KI überarbeiten
          </Button>
        </div>
      )}
    </div>
  );
}
