import Link from "next/link";
import type { Metadata } from "next";
import { WiderrufForm } from "@/components/buchwerk/widerruf-form";

export const metadata: Metadata = {
  title: "Vertrag widerrufen — Buchwerk.info",
  description:
    "Online-Widerruf: Erkläre den Widerruf deines Vertrags mit Buchwerk in zwei Schritten.",
};

export default function WiderrufErklaerenPage() {
  return (
    <main className="flex-1">
      <article className="mx-auto max-w-2xl px-6 py-20 sm:py-28">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Buchwerk.info
        </p>
        <h1 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Vertrag widerrufen
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          Hier kannst du den Widerruf eines Vertrags mit Buchwerk online
          erklären — in zwei Schritten und ohne Anmeldung. Du erhältst eine
          Eingangsbestätigung per E-Mail. Die Voraussetzungen findest du in der{" "}
          <Link
            href="/widerruf"
            className="text-foreground underline underline-offset-4 hover:no-underline"
          >
            Widerrufsbelehrung
          </Link>
          .
        </p>

        <div className="mt-10">
          <WiderrufForm />
        </div>

        <p className="mt-10 text-xs leading-relaxed text-muted-foreground">
          Hinweis: Bei digitalen Inhalten kann das Widerrufsrecht vorzeitig
          erlöschen, wenn du der sofortigen Ausführung ausdrücklich zugestimmt
          und den Verlust des Widerrufsrechts bestätigt hast. Wir prüfen deinen
          Widerruf und melden uns zur weiteren Abwicklung.
        </p>
      </article>
    </main>
  );
}
