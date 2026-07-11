"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  checkoutBookAction,
  checkoutSubscriptionAction,
} from "@/lib/billing/checkout-actions";

export function CheckoutForm({ projectId }: { projectId: string }) {
  const [consentImmediate, setConsentImmediate] = useState(false);
  const [consentWaiver, setConsentWaiver] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const consent = consentImmediate && consentWaiver;

  function buyBook() {
    setError(null);
    startTransition(async () => {
      const result = await checkoutBookAction(projectId, consent);
      if (result?.error) setError(result.error);
    });
  }

  function subscribe() {
    setError(null);
    startTransition(async () => {
      const result = await checkoutSubscriptionAction(consent);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="mt-8 space-y-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="relative flex flex-col rounded-2xl border-2 border-primary bg-card p-6">
          <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
            Empfohlen fürs erste Buch
          </span>
          <h2 className="text-sm font-semibold text-muted-foreground">
            Dieses Buch
          </h2>
          <p className="font-display mt-1.5 text-4xl font-bold text-foreground">
            19,99 €
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Einmalig. Schaltet die Produktion für dieses Buchprojekt dauerhaft
            frei.
          </p>
          <Button
            type="button"
            size="lg"
            className="mt-5 w-full"
            disabled={!consent || isPending}
            onClick={buyBook}
          >
            {isPending ? "…" : "Buch kaufen"}
          </Button>
        </div>

        <div className="flex flex-col rounded-2xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold text-muted-foreground">Abo</h2>
          <p className="font-display mt-1.5 text-4xl font-bold text-foreground">
            29,99{" "}
            <span className="text-base font-medium text-muted-foreground">
              € / Monat
            </span>
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Bis zu 10 Bücher pro Monat freischalten. Monatlich kündbar.
          </p>
          <Button
            type="button"
            size="lg"
            variant="secondary"
            className="mt-5 w-full"
            disabled={!consent || isPending}
            onClick={subscribe}
          >
            {isPending ? "…" : "Abo starten"}
          </Button>
        </div>
      </div>

      <fieldset className="space-y-3 rounded-2xl border border-border bg-card p-6">
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

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <p className="text-xs text-muted-foreground">
        Zahlung läuft sicher über Stripe. (Aktuell Testmodus — bitte
        Stripe-Testkarte 4242 4242 4242 4242 verwenden.)
      </p>
    </div>
  );
}
