"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/buchwerk/status-badge";
import {
  markPublishedAction,
  unmarkPublishedAction,
} from "@/lib/books/publish-actions";

// The "published on Amazon KDP" milestone. There's no KDP API, so the author
// sets it themselves — this completes the workflow and flips the status to
// "Veröffentlicht". The Amazon link is optional.
export function PublishStatus({
  projectId,
  publishedAt,
  amazonUrl,
}: {
  projectId: string;
  publishedAt: string | null;
  amazonUrl: string | null;
}) {
  const router = useRouter();
  const [amazon, setAmazon] = useState(amazonUrl ?? "");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const published = Boolean(publishedAt);

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.ok) router.refresh();
      else setError(result.error ?? "Etwas ist schiefgelaufen.");
    });
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-6 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold">
          Bei Amazon veröffentlicht
        </h2>
        {published ? (
          <StatusBadge intent="done">✓ Veröffentlicht</StatusBadge>
        ) : (
          <StatusBadge intent="neutral">Noch nicht</StatusBadge>
        )}
      </div>

      {published ? (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            Dein Buch ist als bei Amazon veröffentlicht markiert. Der Schritt
            zählt jetzt als erledigt.
          </p>
          {amazon.trim() ? (
            <a
              href={amazon.trim()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-sm font-semibold text-primary underline underline-offset-4"
            >
              Zum Buch bei Amazon →
            </a>
          ) : null}
          <div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isPending}
              onClick={() => run(() => unmarkPublishedAction(projectId))}
            >
              {isPending ? "…" : "Doch nicht veröffentlicht — zurücknehmen"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            Sobald du dein Buch bei Amazon KDP hochgeladen und veröffentlicht
            hast, markier es hier — dann steht überall „Veröffentlicht“ statt
            „Entwurf“.
          </p>
          <div className="max-w-md space-y-1.5">
            <Label htmlFor="amazon-published-url">
              Amazon-Link (optional)
            </Label>
            <Input
              id="amazon-published-url"
              type="url"
              inputMode="url"
              value={amazon}
              onChange={(e) => setAmazon(e.target.value)}
              disabled={isPending}
              placeholder="https://www.amazon.de/dp/…"
            />
            <p className="text-xs text-muted-foreground">
              Nur nötig, wenn du das Buch später im Buchwerk-Shop mit
              „Bei Amazon kaufen“ verlinken willst.
            </p>
          </div>
          <Button type="button" disabled={isPending} onClick={() => run(() => markPublishedAction(projectId, amazon))}>
            {isPending ? "…" : "Als bei Amazon veröffentlicht markieren"}
          </Button>
        </div>
      )}

      {error ? (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </section>
  );
}
