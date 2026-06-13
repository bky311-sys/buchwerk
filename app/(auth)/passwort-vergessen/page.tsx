import type { Metadata } from "next";
import { ResetRequestForm } from "@/components/buchwerk/reset-request-form";

export const metadata: Metadata = {
  title: "Passwort vergessen — Buchwerk",
};

export default function PasswortVergessenPage() {
  return (
    <div>
      <h1 className="text-2xl font-medium tracking-tight">Passwort vergessen</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Gib deine E-Mail-Adresse ein. Wir schicken dir einen Link, mit dem du
        ein neues Passwort setzen kannst.
      </p>

      <div className="mt-6">
        <ResetRequestForm />
      </div>
    </div>
  );
}
