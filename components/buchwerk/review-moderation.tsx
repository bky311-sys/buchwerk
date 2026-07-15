"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Stars } from "@/components/buchwerk/stars";
import {
  approveReviewAction,
  rejectReviewAction,
} from "@/lib/shop/review-actions";

type PendingReview = {
  id: string;
  rating: number;
  body: string | null;
  createdAt: string;
};

export function ReviewModeration({ reviews }: { reviews: PendingReview[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

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
      <h2 className="font-display text-lg font-semibold">
        Bewertungen freigeben ({reviews.length})
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Prüfe eingegangene Bewertungen. Nach der Freigabe wird die Bewertung
        öffentlich sichtbar. Auf die Punkte des Lesers hat das keinen Einfluss —
        die sind schon gutgeschrieben, unabhängig von den Sternen und von deiner
        Entscheidung.
      </p>

      <ul className="mt-4 space-y-3">
        {reviews.map((r) => (
          <li
            key={r.id}
            className="rounded-xl border border-border bg-muted p-4"
          >
            <Stars value={r.rating} />
            {r.body ? (
              <p className="mt-2 text-sm text-foreground">{r.body}</p>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                (ohne Text)
              </p>
            )}
            <div className="mt-3 flex gap-2">
              <Button
                type="button"
                size="sm"
                disabled={isPending}
                onClick={() => run(() => approveReviewAction(r.id))}
              >
                Freigeben
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() => run(() => rejectReviewAction(r.id))}
              >
                Ablehnen
              </Button>
            </div>
          </li>
        ))}
      </ul>

      {error ? (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </section>
  );
}
