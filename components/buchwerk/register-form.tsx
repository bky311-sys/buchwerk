"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleButton } from "@/components/buchwerk/google-button";
import { signUpAction, type AuthState } from "@/lib/auth/actions";

const initialState: AuthState = { error: null };

type Props = {
  // Return target after signup, propagated from the ?weiter= query param
  // (used by the lead-magnet topic flow).
  weiter?: string;
};

export function RegisterForm({ weiter }: Props) {
  const [state, formAction, isPending] = useActionState(
    signUpAction,
    initialState,
  );

  // Email confirmation pending — the user has to click the link before login.
  if (state.success) {
    return (
      <div className="rounded-lg border border-border bg-muted p-5">
        <p className="text-sm text-foreground">
          Fast geschafft. Wir haben dir eine E-Mail mit einem Bestätigungslink
          geschickt. Öffne den Link, um dein Konto zu aktivieren.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Keine Mail erhalten? Schau auch im Spam-Ordner nach.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <GoogleButton
        next={weiter ?? "/dashboard"}
        label="Mit Google registrieren"
      />

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">oder</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <form action={formAction} className="space-y-4" noValidate>
        {weiter ? <input type="hidden" name="weiter" value={weiter} /> : null}
        <div className="space-y-2">
          <Label htmlFor="email">E-Mail-Adresse</Label>
          <Input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="deine@email.de"
            required
            disabled={isPending}
            aria-invalid={state.error ? true : undefined}
            className="h-11 px-4 text-base"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Passwort</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="Mindestens 8 Zeichen"
            required
            disabled={isPending}
            aria-invalid={state.error ? true : undefined}
            className="h-11 px-4 text-base"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="passwortWiederholen">Passwort wiederholen</Label>
          <Input
            id="passwortWiederholen"
            name="passwortWiederholen"
            type="password"
            autoComplete="new-password"
            required
            disabled={isPending}
            aria-invalid={state.error ? true : undefined}
            className="h-11 px-4 text-base"
          />
        </div>

        {state.error ? (
          <p role="alert" className="text-sm text-destructive">
            {state.error}
          </p>
        ) : null}

        <Button
          type="submit"
          size="lg"
          disabled={isPending}
          className="h-11 w-full px-5 text-base"
        >
          {isPending ? "Konto wird erstellt…" : "Konto erstellen"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Schon registriert?{" "}
          <Link
            href="/anmelden"
            className="text-foreground underline underline-offset-4 hover:no-underline"
          >
            Anmelden
          </Link>
        </p>
      </form>
    </div>
  );
}
