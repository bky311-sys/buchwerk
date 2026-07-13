"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitWithdrawalAction } from "@/lib/legal/widerruf-actions";

const TEXTAREA_CLASS =
  "flex w-full rounded-xl border border-input bg-card px-4 py-3 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50";

type Step = "form" | "confirm" | "done";

export function WiderrufForm() {
  const [step, setStep] = useState<Step>("form");
  const [name, setName] = useState("");
  const [contract, setContract] = useState("");
  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const canContinue =
    name.trim() && contract.trim() && /.+@.+\..+/.test(email.trim());

  function confirm() {
    setError(null);
    startTransition(async () => {
      const result = await submitWithdrawalAction({ name, contract, email });
      if (result.ok) setStep("done");
      else setError(result.error ?? "Etwas ist schiefgelaufen.");
    });
  }

  if (step === "done") {
    return (
      <div className="rounded-2xl border border-success/30 bg-success-tint p-6">
        <p className="text-base font-semibold text-success">
          ✓ Dein Widerruf ist eingegangen.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Wir haben eine Eingangsbestätigung an{" "}
          <span className="font-medium text-foreground">{email.trim()}</span>{" "}
          gesendet. Über die weitere Abwicklung melden wir uns. Bei Fragen:{" "}
          welcome@buchwerk.info.
        </p>
      </div>
    );
  }

  if (step === "confirm") {
    return (
      <div className="space-y-5">
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="text-sm font-semibold text-foreground">
            Bitte prüfe deine Angaben:
          </p>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 text-muted-foreground">Name</dt>
              <dd className="text-foreground">{name.trim()}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 text-muted-foreground">Vertrag</dt>
              <dd className="whitespace-pre-wrap text-foreground">
                {contract.trim()}
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 text-muted-foreground">E-Mail</dt>
              <dd className="text-foreground">{email.trim()}</dd>
            </div>
          </dl>
        </div>
        <p className="text-sm text-muted-foreground">
          Mit dem Bestätigen erklärst du verbindlich den Widerruf des oben
          bezeichneten Vertrags. Du erhältst eine Eingangsbestätigung per E-Mail.
        </p>
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="lg" onClick={confirm} disabled={isPending}>
            {isPending ? "Wird gesendet…" : "Widerruf verbindlich bestätigen"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="lg"
            disabled={isPending}
            onClick={() => {
              setStep("form");
              setError(null);
            }}
          >
            Zurück
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="w-name">Name</Label>
        <Input
          id="w-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Vor- und Nachname"
          className="h-11 px-4 text-base"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="w-contract">Vertrag identifizieren</Label>
        <textarea
          id="w-contract"
          value={contract}
          onChange={(e) => setContract(e.target.value)}
          rows={2}
          placeholder="z. B. Bestellnummer oder die E-Mail des Kaufs + Kaufdatum"
          className={TEXTAREA_CLASS}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="w-email">E-Mail für die Eingangsbestätigung</Label>
        <Input
          id="w-email"
          type="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="deine@email.de"
          className="h-11 px-4 text-base"
        />
      </div>
      <Button
        type="button"
        size="lg"
        disabled={!canContinue}
        onClick={() => {
          setError(null);
          setStep("confirm");
        }}
        className="h-11 px-5 text-base"
      >
        Weiter zur Bestätigung
      </Button>
    </div>
  );
}
