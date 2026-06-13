import type { Metadata } from "next";
import Link from "next/link";
import { NewPasswordForm } from "@/components/buchwerk/new-password-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Neues Passwort — Buchwerk",
};

export default async function PasswortNeuPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The recovery session is established by /auth/callback after the email link.
  // Without it there is nothing to update — guide the user back.
  if (!user) {
    return (
      <div>
        <h1 className="text-2xl font-medium tracking-tight">
          Link abgelaufen
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Dieser Link ist ungültig oder abgelaufen. Fordere einen neuen Link zum
          Zurücksetzen an.
        </p>
        <p className="mt-6 text-sm">
          <Link
            href="/passwort-vergessen"
            className="text-foreground underline underline-offset-4 hover:no-underline"
          >
            Neuen Link anfordern
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-medium tracking-tight">Neues Passwort</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Wähle ein neues Passwort für dein Buchwerk-Konto.
      </p>

      <div className="mt-6">
        <NewPasswordForm />
      </div>
    </div>
  );
}
