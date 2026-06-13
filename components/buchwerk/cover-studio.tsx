"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  suggestCoverPromptAction,
  generateCoverAction,
  selectCoverAction,
  deleteCoverAction,
} from "@/lib/books/cover-actions";
import type { CoverModel } from "@/lib/ai/replicate";

const TEXTAREA_CLASS =
  "flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50";

type Cover = {
  id: string;
  image_url: string;
  model: string | null;
  is_selected: boolean;
};

export function CoverStudio({
  projectId,
  covers,
}: {
  projectId: string;
  covers: Cover[];
}) {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState<CoverModel>("schnell");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function suggest() {
    setError(null);
    startTransition(async () => {
      const result = await suggestCoverPromptAction(projectId);
      if (result.ok && result.prompt) setPrompt(result.prompt);
      else setError(result.error ?? "Konnte keinen Vorschlag erstellen.");
    });
  }

  function generate() {
    setError(null);
    startTransition(async () => {
      const result = await generateCoverAction(projectId, prompt, model);
      if (result.ok) router.refresh();
      else setError(result.error ?? "Etwas ist schiefgelaufen.");
    });
  }

  function select(id: string) {
    setError(null);
    startTransition(async () => {
      const result = await selectCoverAction(id);
      if (result.ok) router.refresh();
      else setError(result.error ?? "Etwas ist schiefgelaufen.");
    });
  }

  function remove(id: string) {
    if (!window.confirm("Dieses Cover wirklich löschen?")) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteCoverAction(id);
      if (result.ok) router.refresh();
      else setError(result.error ?? "Etwas ist schiefgelaufen.");
    });
  }

  return (
    <div className="mt-8 space-y-8">
      <section className="rounded-lg border border-border bg-muted p-6 space-y-4">
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="cover-prompt">Bildbeschreibung (Prompt)</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={suggest}
              disabled={isPending}
            >
              Vorschlag von der KI
            </Button>
          </div>
          <textarea
            id="cover-prompt"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            disabled={isPending}
            rows={4}
            placeholder="Englischer Bildprompt – oder lass dir oben einen Vorschlag erstellen."
            className={TEXTAREA_CLASS}
          />
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Qualität</legend>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="model"
                checked={model === "schnell"}
                onChange={() => setModel("schnell")}
                disabled={isPending}
              />
              Entwurf (schnell, ~0,003 $)
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="model"
                checked={model === "pro"}
                onChange={() => setModel("pro")}
                disabled={isPending}
              />
              Final (beste Qualität, ~0,04 $)
            </label>
          </div>
        </fieldset>

        <Button
          type="button"
          size="lg"
          onClick={generate}
          disabled={isPending || !prompt.trim()}
        >
          {isPending ? "Wird erstellt…" : "Cover generieren"}
        </Button>

        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </section>

      <section>
        <h2 className="text-lg font-medium">Entwürfe</h2>
        {covers.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Noch keine Cover. Generiere oben dein erstes.
          </p>
        ) : (
          <ul className="mt-4 grid grid-cols-2 gap-6 sm:grid-cols-3">
            {covers.map((cover) => (
              <li key={cover.id} className="space-y-2">
                <div
                  className={
                    cover.is_selected
                      ? "overflow-hidden rounded-lg ring-2 ring-primary"
                      : "overflow-hidden rounded-lg border border-border"
                  }
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={cover.image_url}
                    alt="Cover-Entwurf"
                    className="aspect-[2/3] w-full object-cover"
                  />
                </div>
                {cover.is_selected ? (
                  <p className="text-xs font-medium text-primary">
                    Ausgewählt ✓
                  </p>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isPending}
                    onClick={() => select(cover.id)}
                  >
                    Als Cover wählen
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isPending}
                  onClick={() => remove(cover.id)}
                >
                  Löschen
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
