import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/buchwerk/site-header";
import { LegalFooter } from "@/components/buchwerk/legal-footer";
import { SubscribeCheckout } from "@/components/buchwerk/subscribe-checkout";
import { createClient } from "@/lib/supabase/server";
import { isSubscriber } from "@/lib/billing/access";

export const metadata: Metadata = {
  title: "Preise — Buchwerk",
  description:
    "Thema und Gliederung kostenlos. Ein Buch einmalig für 19,99 € produzieren — oder das Abo für 29,99 €/Monat mit bis zu 10 Büchern und Lesezugriff auf den Buchshop.",
};

// Öffentliche Preisseite. Bis zum 11.08. gab es das Abo NUR im
// Freischalten-Checkout eines Buchprojekts — Leser ohne eigenes Buch
// (Reader-Paywall „Abo ansehen", Bewertungs-Widget) liefen auf eine 404.
// Hier können Eingeloggte das Abo direkt abschließen; Ausgeloggte werden
// zur Registrierung geführt.
export default async function PreisePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const loggedIn = Boolean(user);
  const subscriber = user ? await isSubscriber(supabase, user.id) : false;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl flex-1 px-6 py-16 sm:py-20">
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Fair und ohne Abo-Falle.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
          Thema und Gliederung sind kostenlos — du siehst erst, was Buchwerk aus
          deiner Idee macht, und zahlst dann. Ein komplettes Buch kostet weniger
          als ein Monat ChatGPT&nbsp;Plus — und am Ende hältst du ein
          hochladbares Buchpaket in der Hand. Bezahlung sicher über Stripe,
          monatlich kündbar.
        </p>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          <div className="relative flex flex-col rounded-2xl border-2 border-primary bg-card p-7">
            <span className="absolute -top-3 left-7 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
              Empfohlen fürs erste Buch
            </span>
            <h2 className="text-sm font-semibold text-muted-foreground">
              Einzelnes Buch
            </h2>
            <p className="font-display mt-1.5 text-4xl font-bold text-foreground">
              19,99 €
            </p>
            <p className="mt-2 flex-1 text-sm text-muted-foreground">
              Einmalig. Schaltet Recherche, Kapitel-Schreiben, Cover, KDP-Listing,
              Qualitätscheck und den Manuskript-Download für dieses Buch
              dauerhaft frei.
            </p>
            <div className="mt-6">
              <Button asChild size="lg" className="w-full">
                <Link href={loggedIn ? "/projekte" : "/registrieren"}>
                  {loggedIn
                    ? "Buch anlegen & freischalten"
                    : "Mit diesem Buch starten"}
                </Link>
              </Button>
            </div>
          </div>

          <div className="flex flex-col rounded-2xl border border-border bg-card p-7">
            <h2 className="text-sm font-semibold text-muted-foreground">
              Abo für Vielschreiber &amp; Leser
            </h2>
            <p className="font-display mt-1.5 text-4xl font-bold text-foreground">
              29,99{" "}
              <span className="text-base font-medium text-muted-foreground">
                € / Monat
              </span>
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Bis zu 10 Bücher pro Monat freischalten (faire Nutzung). Dazu:
              freigegebene Bücher im Buchshop vollständig lesen und bewerten —
              jede Bewertung bringt Punkte. Monatlich kündbar.
            </p>

            {subscriber ? (
              <div className="mt-6 rounded-xl border border-success/40 bg-success-tint px-4 py-3">
                <p className="text-sm font-semibold text-success">
                  ✓ Du hast das Abo bereits.
                </p>
                <Link
                  href="/projekte"
                  className="mt-1 inline-block text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
                >
                  Zu deinen Projekten →
                </Link>
              </div>
            ) : loggedIn ? (
              <SubscribeCheckout />
            ) : (
              <div className="mt-6">
                <Button asChild size="lg" variant="secondary" className="w-full">
                  <Link href="/registrieren">
                    Kostenlos registrieren &amp; Abo starten
                  </Link>
                </Button>
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  Schon ein Konto?{" "}
                  <Link
                    href="/anmelden?next=/preise"
                    className="underline underline-offset-4 hover:text-foreground"
                  >
                    Anmelden
                  </Link>
                </p>
              </div>
            )}
          </div>
        </div>

        <p className="mt-8 max-w-2xl text-sm text-muted-foreground">
          Für beide gilt: Buchwerk ist kein Verlag — du behältst alle Rechte und
          Einnahmen aus deinen Büchern. Die Veröffentlichung bei Amazon KDP
          machst du selbst, mit fertigen Bausteinen und Schritt-für-Schritt-
          Anleitung.
        </p>
      </main>
      <LegalFooter />
    </>
  );
}
