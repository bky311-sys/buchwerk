"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  waitlistPayloadSchema,
  type WaitlistSource,
} from "@/lib/waitlist/schema";
import { cn } from "@/lib/utils";

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

type Props = {
  source: WaitlistSource;
  className?: string;
};

export function WaitlistForm({ source, className }: Props) {
  const inputId = useId();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const isSubmitting = status.kind === "submitting";
  const isSuccess = status.kind === "success";
  const isError = status.kind === "error";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting || isSuccess) return;

    const parsed = waitlistPayloadSchema.safeParse({ email, source });
    if (!parsed.success) {
      setStatus({
        kind: "error",
        message:
          parsed.error.issues[0]?.message ?? "Bitte prüfe deine Eingabe.",
      });
      return;
    }

    setStatus({ kind: "submitting" });

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const data = (await response.json().catch(() => null)) as
        | { ok: boolean; message?: string }
        | null;

      if (!response.ok || !data?.ok) {
        setStatus({
          kind: "error",
          message:
            data?.message ??
            "Gerade ging etwas schief. Versuch es in einem Moment noch einmal.",
        });
        return;
      }

      setStatus({
        kind: "success",
        message:
          data.message ?? "Danke — wir melden uns, sobald Buchwerk startet.",
      });
      setEmail("");
    } catch {
      setStatus({
        kind: "error",
        message:
          "Keine Verbindung. Prüf deine Internetverbindung und versuch es noch einmal.",
      });
    }
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className={cn("w-full max-w-xl", className)}
      aria-describedby={`${inputId}-hint`}
    >
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor={inputId} className="sr-only">
          Email-Adresse
        </label>
        <Input
          id={inputId}
          type="email"
          inputMode="email"
          autoComplete="email"
          name="email"
          placeholder="deine@email.de"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (isError) setStatus({ kind: "idle" });
          }}
          disabled={isSubmitting || isSuccess}
          aria-invalid={isError || undefined}
          aria-describedby={
            isError ? `${inputId}-error` : `${inputId}-hint`
          }
          className="h-11 flex-1 px-4 text-base"
          required
        />
        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting || isSuccess}
          className="h-11 px-5 text-base"
        >
          {isSubmitting
            ? "Wird gesendet…"
            : isSuccess
              ? "Eingetragen"
              : "Bei Start benachrichtigen"}
        </Button>
      </div>

      <p
        id={`${inputId}-hint`}
        className={cn(
          "mt-2 text-xs text-muted-foreground",
          (isError || isSuccess) && "sr-only",
        )}
      >
        Eine Mail, wenn Buchwerk live geht. Kein Newsletter.
      </p>

      {isError ? (
        <p
          id={`${inputId}-error`}
          role="alert"
          className="mt-2 text-xs text-destructive"
        >
          {status.message}
        </p>
      ) : null}

      {isSuccess ? (
        <p role="status" className="mt-2 text-xs text-foreground">
          {status.message}
        </p>
      ) : null}
    </form>
  );
}
