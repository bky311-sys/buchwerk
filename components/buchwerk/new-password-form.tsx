"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updatePasswordAction, type AuthState } from "@/lib/auth/actions";

const initialState: AuthState = { error: null };

export function NewPasswordForm() {
  const [state, formAction, isPending] = useActionState(
    updatePasswordAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="password">Neues Passwort</Label>
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
        <Label htmlFor="passwortWiederholen">Neues Passwort wiederholen</Label>
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
        {isPending ? "Wird gespeichert…" : "Passwort speichern"}
      </Button>
    </form>
  );
}
