"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/buchwerk/status-badge";
import { submitReviewAction } from "@/lib/shop/review-actions";

type Props = {
  bookId: string;
  slug: string;
  loggedIn: boolean;
  isOwnBook: boolean;
  isReadable: boolean;
  isSubscriber: boolean;
  chaptersRead: number;
  chaptersTotal: number;
  chaptersRequired: number;
  hasReadEnough: boolean;
  hasReviewed: boolean;
  reviewStatus: string | null;
  rejectionReason: string | null;
  loginHref: string;
};

export function ReviewWidget(props: Props) {
  const {
    bookId,
    slug,
    loggedIn,
    isOwnBook,
    isReadable,
    isSubscriber,
    chaptersRead,
    chaptersTotal,
    chaptersRequired,
    hasReadEnough,
    hasReviewed,
    reviewStatus,
    rejectionReason,
    loginHref,
  } = props;

  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (isOwnBook) return null;

  const box = "rounded-2xl border border-border bg-card p-6";

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.ok) router.refresh();
      else setError(result.error ?? "Etwas ist schiefgelaufen.");
    });
  }

  // Already reviewed — show the state and, on rejection, the reason (Art. 17 DSA).
  if (hasReviewed) {
    return (
      <div className={box} id="bewerten">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-lg font-semibold">Deine Bewertung</h2>
          {reviewStatus === "approved" ? (
            <StatusBadge intent="done">Veröffentlicht</StatusBadge>
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
        {reviewStatus === "rejected" ? (
          <div className="mt-3 rounded-xl border border-border bg-muted p-4">
            <p className="text-sm font-medium">Begründung des Autors</p>
            <p className="mt-1 text-sm whitespace-pre-wrap text-foreground">
              {rejectionReason ?? "Keine Begründung hinterlegt."}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Du hältst das für falsch? Schreib uns an{" "}
              <a
                href="mailto:welcome@buchwerk.info"
                className="underline underline-offset-2"
              >
                welcome@buchwerk.info
              </a>{" "}
              — wir sehen uns das an.
            </p>
          </div>
        ) : null}
      </div>
    );
  }

  // The author never opened the book for reading — then there is nothing to
  // review, because nobody here could have read it.
  if (!isReadable) {
    return (
      <div className={box} id="bewerten">
        <h2 className="font-display text-lg font-semibold">Buch bewerten</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Der Autor hat dieses Buch nicht zum Lesen freigegeben. Bewertet werden
          kann hier nur, was hier auch gelesen werden kann.
        </p>
      </div>
    );
  }

  if (!loggedIn) {
    return (
      <div className={box} id="bewerten">
        <h2 className="font-display text-lg font-semibold">Buch bewerten</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          <Link href={loginHref} className="underline underline-offset-2">
            Melde dich an
          </Link>
          , um dieses Buch zu lesen und zu bewerten.
        </p>
      </div>
    );
  }

  if (!isSubscriber) {
    return (
      <div className={box} id="bewerten">
        <h2 className="font-display text-lg font-semibold">Buch bewerten</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Bücher im Buchshop lesen und bewerten ist im Abo enthalten.
        </p>
        <Button asChild className="mt-4">
          <Link href="/preise">Abo ansehen</Link>
        </Button>
      </div>
    );
  }

  // Subscriber, but hasn't read enough yet. This is the honest version of the
  // old "mark as read + wait 2 hours" gate: you get to review what you read.
  if (!hasReadEnough) {
    return (
      <div className={box} id="bewerten">
        <h2 className="font-display text-lg font-semibold">Buch bewerten</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {chaptersRead === 0
            ? "Bewerten kannst du dieses Buch, wenn du es gelesen hast. Das geht hier direkt im Browser."
            : `Du hast ${chaptersRead} von ${chaptersTotal} Kapiteln gelesen. Ab ${chaptersRequired} kannst du bewerten.`}
        </p>
        <Button asChild className="mt-4">
          <Link href={`/buchshop/${slug}/lesen`}>
            {chaptersRead === 0 ? "Buch lesen" : "Weiterlesen"}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className={box} id="bewerten">
      <h2 className="font-display text-lg font-semibold">Buch bewerten</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Du hast {chaptersRead} von {chaptersTotal} Kapiteln gelesen. Sei ehrlich —
        die Punktzahl ist gleich, egal wie viele Sterne du gibst.
      </p>

      <div className="mt-4 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`${n} ${n === 1 ? "Stern" : "Sterne"}`}
            aria-pressed={rating === n}
            disabled={isPending}
            onClick={() => setRating(n)}
            className="p-1 text-2xl leading-none"
          >
            <span className={n <= rating ? "text-foreground" : "text-border"}>
              ★
            </span>
          </button>
        ))}
      </div>

      <label htmlFor="review-body" className="mt-4 block text-sm font-medium">
        Was sollten andere über dieses Buch wissen?
      </label>
      <p className="mt-1 text-xs text-muted-foreground">
        Freiwillig. Was hat dir geholfen, was hat gefehlt, für wen ist das Buch?
      </p>
      <textarea
        id="review-body"
        rows={4}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        disabled={isPending}
        className="mt-2 w-full rounded-xl border border-input bg-background p-3 text-sm"
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
