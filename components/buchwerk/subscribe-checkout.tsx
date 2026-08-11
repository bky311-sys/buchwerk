"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { checkoutSubscriptionAction } from "@/lib/billing/checkout-actions";

// Abo-Checkout ohne Projekt-Kontext — für die /preise-Seite. Vorher gab es das
// Abo NUR im Freischalten-Checkout eines Buchprojekts; Leser ohne eigenes Buch
// (Reader-Paywall, Bewerten) hatten keinen Weg zum Abo (Review-Fund 11.08.,
// „Abo ansehen" zeigte auf eine 404). Die §356-Abs.-5-Doppelbestätigung ist
// wortgleich mit dem Projekt-Checkout (checkout-form.tsx).
export function SubscribeCheckout() {
  const [consentImmediate, setConsentImmediate] = useState(false);
  const [consentWaiver, setConsentWaiver] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const consent = consentImmediate && consentWaiver;

  function subscribe() {
    setError(null);
    startTransition(async () => {
      const result = await checkoutSubscriptionAction(consent);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="mt-6 space-y-4">
      <fieldset className="space-y-3 rounded-2xl border border-border bg-card p-4">
        <legend className="px-1 text-sm font-semibold">Widerrufsrecht</legend>
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={consentImmediate}
            onChange={(e) => setConsentImmediate(e.target.checked)}
            disabled={isPending}
            className="mt-0.5 size-4 accent-primary"
          />
          <span>
            Ich verlange ausdrücklich, dass Buchwerk mit der Leistung sofort
            beginnt.
          </span>
        </label>
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={consentWaiver}
            onChange={(e) => setConsentWaiver(e.target.checked)}
            disabled={isPending}
            className="mt-0.5 size-4 accent-primary"
          />
          <span>
            Mir ist bekannt, dass ich mit Beginn der Leistung mein Widerrufsrecht
            verliere (§ 356 Abs. 5 BGB).
          </span>
        </label>
        <p className="text-xs text-muted-foreground">
          Mit dem Kauf akzeptierst du die{" "}
          <Link
            href="/agb"
            className="underline underline-offset-4 hover:text-foreground"
          >
            AGB
          </Link>{" "}
          und die{" "}
          <Link
            href="/widerruf"
            className="underline underline-offset-4 hover:text-foreground"
          >
            Widerrufsbelehrung
          </Link>
          .
        </p>
      </fieldset>

      <Button
        type="button"
        size="lg"
        className="w-full"
        disabled={!consent || isPending}
        onClick={subscribe}
      >
        {isPending ? "…" : "Abo starten"}
      </Button>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
