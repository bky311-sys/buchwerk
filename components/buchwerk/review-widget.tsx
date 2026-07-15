"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/buchwerk/status-badge";
import {
  markReadingAction,
  submitReviewAction,
} from "@/lib/shop/review-actions";

type Props = {
  bookId: string;
  loggedIn: boolean;
  isOwnBook: boolean;
  acquiredAt: string | null;
  canReviewAt: number | null;
  hasReviewed: boolean;
  reviewStatus: string | null;
  loginHref: string;
};

const KIND_LABEL: Record<string, string> = {
  pdf: "PDF",
  kindle: "Kindle / Prime",
  kauf: "Kauf",
};

export function ReviewWidget(props: Props) {
  const {
    bookId,
    loggedIn,
    isOwnBook,
    acquiredAt,
    canReviewAt,
    hasReviewed,
    reviewStatus,
    loginHref,
  } = props;

  const router = useRouter();
  const [kind, setKind] = useState("kauf");
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Remaining lock time, computed after mount to avoid hydration mismatch.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  if (isOwnBook) return null;

  const box = "rounded-2xl border border-border bg-card p-6";

  if (!loggedIn) {
    return (
      <div className={box}>
        <h2 className="font-display text-lg font-semibold">Buch bewerten</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          <Link
            href={loginHref}
            className="font-semibold text-primary underline underline-offset-4"
          >
            Melde dich an
          </Link>
          , um dieses Buch zu bewerten und Punkte zu sammeln.
        </p>
      </div>
    );
  }

  if (hasReviewed) {
    return (
      <div className={box}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold">Deine Bewertung</h2>
          {reviewStatus === "approved" ? (
            <StatusBadge intent="done">✓ Veröffentlicht</StatusBadge>
          ) : reviewStatus === "rejected" ? (
            <StatusBadge intent="neutral">Nicht freigegeben</StatusBadge>
          ) : (
            <StatusBadge intent="draft">Wartet auf Freigabe</StatusBadge>
          )}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {reviewStatus === "approved"
            ? "Danke! Deine Bewertung ist veröffentlicht. Deine Punkte sind gutgeschrieben."
            : reviewStatus === "rejected"
              ? "Der Autor hat deine Bewertung nicht freigegeben. Deine Punkte behältst du."
              : "Der Autor prüft, ob deine Bewertung öffentlich erscheint. Deine Punkte sind unabhängig davon bereits gutgeschrieben."}
        </p>
      </div>
    );
  }

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.ok) router.refresh();
      else setError(result.error ?? "Etwas ist schiefgelaufen.");
    });
  }

  // Not yet marked as read.
  if (!acquiredAt) {
    return (
      <div className={box}>
        <h2 className="font-display text-lg font-semibold">Buch bewerten</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Du sammelst Punkte für eine ehrliche Bewertung. Markiere das Buch als
          gelesen — bewerten kannst du 2 Stunden später (damit es wirklich
          gelesen wird).
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <label className="text-sm text-muted-foreground" htmlFor="kind">
            Ich habe das Buch als
          </label>
          <select
            id="kind"
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            disabled={isPending}
            className="h-9 rounded-xl border border-input bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
          >
            {Object.entries(KIND_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-4">
          <Button
            type="button"
            disabled={isPending}
            onClick={() => run(() => markReadingAction(bookId, kind))}
          >
            {isPending ? "…" : "Ich lese dieses Buch"}
          </Button>
        </div>
        {error ? (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  // Marked as read, but the 2-hour lock hasn't elapsed yet.
  const locked = canReviewAt !== null && now !== null && now < canReviewAt;
  if (locked && canReviewAt !== null && now !== null) {
    const mins = Math.max(1, Math.ceil((canReviewAt - now) / 60_000));
    const label =
      mins >= 60
        ? `${Math.floor(mins / 60)} Std ${mins % 60} Min`
        : `${mins} Min`;
    return (
      <div className={box}>
        <h2 className="font-display text-lg font-semibold">Buch bewerten</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Danke fürs Lesen. Du kannst dieses Buch in etwa{" "}
          <span className="font-semibold text-foreground">{label}</span>{" "}
          bewerten.
        </p>
      </div>
    );
  }

  // Review form.
  return (
    <div className={box}>
      <h2 className="font-display text-lg font-semibold">Buch bewerten</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Sei ehrlich — die Punktzahl ist gleich, egal wie viele Sterne du gibst.
      </p>

      <div className="mt-4 flex items-center gap-1" role="group" aria-label="Sterne">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            disabled={isPending}
            onClick={() => setRating(n)}
            aria-label={`${n} Sterne`}
            className={
              n <= rating
                ? "text-2xl text-primary"
                : "text-2xl text-input hover:text-primary/50"
            }
          >
            ★
          </button>
        ))}
      </div>

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        disabled={isPending}
        rows={4}
        placeholder="Was hat dir gefallen, was nicht? (optional)"
        className="mt-4 flex w-full rounded-xl border border-input bg-muted px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:opacity-50"
      />

      <div className="mt-4">
        <Button
          type="button"
          disabled={isPending || rating < 1}
          onClick={() => run(() => submitReviewAction(bookId, rating, body))}
        >
          {isPending ? "Wird gesendet…" : "Bewertung abschicken"}
        </Button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Deine Punkte bekommst du sofort — unabhängig von den Sternen und davon,
        ob der Autor die Bewertung öffentlich stellt.
      </p>
      {error ? (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
