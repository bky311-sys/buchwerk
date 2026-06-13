"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordResetAction, type AuthState } from "@/lib/auth/actions";

const initialState: AuthState = { error: null };

export function ResetRequestForm() {
  const [state, formAction, isPending] = useActionState(
    requestPasswordResetAction,
    initialState,
  );

  if (state.success) {
    return (
      <div className="rounded-lg border border-border bg-muted p-5">
        <p className="text-sm text-foreground">
          Wenn ein Konto mit dieser Adresse existiert, haben wir dir einen Link
          zum Zurücksetzen geschickt. Schau in deine Mailbox.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Keine Mail erhalten? Schau auch im Spam-Ordner nach.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4" noValidate>
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
        {isPending ? "Wird gesendet…" : "Link zum Zurücksetzen senden"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Doch wieder eingefallen?{" "}
        <Link
          href="/anmelden"
          className="text-foreground underline underline-offset-4 hover:no-underline"
        >
          Zur Anmeldung
        </Link>
      </p>
    </form>
  );
}
