import type { Metadata } from "next";
import { RegisterForm } from "@/components/buchwerk/register-form";

export const metadata: Metadata = {
  title: "Registrieren — Buchwerk",
};

export default function RegistrierenPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold tracking-tight">Konto erstellen</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Starte dein erstes Buchprojekt mit Buchwerk.
      </p>

      <div className="mt-6">
        <RegisterForm />
      </div>
    </div>
  );
}
