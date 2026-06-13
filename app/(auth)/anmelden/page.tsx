import type { Metadata } from "next";
import { LoginForm } from "@/components/buchwerk/login-form";

export const metadata: Metadata = {
  title: "Anmelden — Buchwerk",
};

export default async function AnmeldenPage({
  searchParams,
}: {
  searchParams: Promise<{ weiter?: string; fehler?: string }>;
}) {
  const { weiter, fehler } = await searchParams;

  return (
    <div>
      <h1 className="text-2xl font-medium tracking-tight">Willkommen zurück</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Melde dich mit deiner E-Mail-Adresse an.
      </p>

      {fehler === "bestaetigung" ? (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-border bg-muted p-3 text-sm text-destructive"
        >
          Der Bestätigungslink war ungültig oder abgelaufen. Bitte melde dich an
          oder registriere dich erneut.
        </p>
      ) : null}

      <div className="mt-6">
        <LoginForm weiter={weiter} />
      </div>
    </div>
  );
}
