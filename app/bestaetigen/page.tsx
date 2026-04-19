import Link from "next/link";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Anmeldung bestätigen — Buchwerk.info",
  description: "Bestätige deine Anmeldung auf der Buchwerk-Warteliste.",
};

export const dynamic = "force-dynamic";

type Status = "success" | "already" | "invalid";

type Props = {
  searchParams: Promise<{ token?: string | string[] }>;
};

export default async function BestaetigenPage({ searchParams }: Props) {
  const { token } = await searchParams;
  const status = await processToken(typeof token === "string" ? token : null);

  const copy = COPY[status];

  return (
    <main className="flex-1">
      <article className="mx-auto max-w-xl px-6 py-24 sm:py-32">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Buchwerk.info
        </p>
        <h1 className="mt-4 text-3xl font-medium tracking-tight sm:text-4xl">
          {copy.headline}
        </h1>
        <p className="mt-6 text-base leading-relaxed text-muted-foreground">
          {copy.body}
        </p>
        <p className="mt-10 text-sm">
          <Link
            href="/"
            className="text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Zurück zur Startseite
          </Link>
        </p>
      </article>
    </main>
  );
}

async function processToken(token: string | null): Promise<Status> {
  if (!token || token.length < 16 || token.length > 128) {
    return "invalid";
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("waitlist")
    .select("id, confirmed_at")
    .eq("confirmation_token", token)
    .maybeSingle();

  if (error) {
    console.error("[bestaetigen] lookup failed", error);
    return "invalid";
  }
  if (!data) return "invalid";
  if (data.confirmed_at) return "already";

  const { error: updateError } = await supabase
    .from("waitlist")
    .update({ confirmed_at: new Date().toISOString() })
    .eq("id", data.id);

  if (updateError) {
    console.error("[bestaetigen] update failed", updateError);
    return "invalid";
  }

  return "success";
}

const COPY: Record<Status, { headline: string; body: string }> = {
  success: {
    headline: "Bestätigt.",
    body: "Danke — du stehst jetzt auf der Warteliste. Wir melden uns einmalig, sobald Buchwerk offiziell startet. Keine weiteren Mails.",
  },
  already: {
    headline: "Bereits bestätigt.",
    body: "Deine Anmeldung war schon aktiv. Du bekommst von uns eine Mail, sobald Buchwerk startet — nicht vorher.",
  },
  invalid: {
    headline: "Link ungültig oder abgelaufen.",
    body: "Dieser Bestätigungslink funktioniert nicht mehr. Möglicherweise ist er älter als 48 Stunden oder wurde bereits benutzt. Trag dich einfach noch einmal auf der Startseite ein — du bekommst dann einen neuen Link.",
  },
};
