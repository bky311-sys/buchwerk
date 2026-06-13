"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleButton } from "@/components/buchwerk/google-button";
import { signInAction, type AuthState } from "@/lib/auth/actions";

const initialState: AuthState = { error: null };

type Props = {
  // Return target after login, propagated from the ?weiter= query param.
  weiter?: string;
};

export function LoginForm({ weiter }: Props) {
  const [state, formAction, isPending] = useActionState(
    signInAction,
    initialState,
  );

  return (
    <div className="space-y-4">
      <GoogleButton next={weiter ?? "/dashboard"} />

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
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Passwort</Label>
            <Link
              href="/passwort-vergessen"
              className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              Passwort vergessen?
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
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
          {isPending ? "Wird angemeldet…" : "Anmelden"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Noch kein Konto?{" "}
          <Link
            href="/registrieren"
            className="text-foreground underline underline-offset-4 hover:no-underline"
          >
            Jetzt registrieren
          </Link>
        </p>
      </form>
    </div>
  );
}
