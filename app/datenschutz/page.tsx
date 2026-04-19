import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Datenschutz — Buchwerk.info",
  description:
    "Vorläufige Datenschutzerklärung für Buchwerk.info während der Entwicklungsphase.",
};

export default function DatenschutzPage() {
  return (
    <main className="flex-1">
      <article className="mx-auto max-w-2xl px-6 py-20 sm:py-28">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Buchwerk.info
        </p>
        <h1 className="mt-4 text-3xl font-medium tracking-tight sm:text-4xl">
          Datenschutzerklärung
        </h1>

        <div className="mt-10 space-y-6 text-base leading-relaxed text-muted-foreground">
          <p className="rounded-lg border border-border bg-muted p-4 text-sm text-foreground">
            Diese Datenschutzerklärung wird vor dem öffentlichen Launch durch
            eine juristisch geprüfte Fassung ersetzt. Bis dahin befindet sich
            Buchwerk.info im Platzhalter-Betrieb. Die folgenden Hinweise
            beschreiben, was aktuell tatsächlich passiert.
          </p>

          <section className="space-y-2">
            <h2 className="text-lg font-medium text-foreground">
              Verantwortlicher
            </h2>
            <p>
              Benjamin Koch
              <br />
              Friedrichstraße 33
              <br />
              58791 Werdohl
              <br />
              Email: welcome@buchwerk.info
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-medium text-foreground">
              Warteliste
            </h2>
            <p>
              Wenn du dich auf die Warteliste einträgst, speichern wir deine
              Email-Adresse, den Zeitpunkt der Eintragung, den Ursprung des
              Formulars (Hero- oder Footer-Bereich) und deinen User-Agent. Wir
              verwenden diese Daten ausschließlich, um dich einmalig zum Start
              von Buchwerk zu benachrichtigen.
            </p>
            <p>
              Rechtsgrundlage: Art. 6 Abs. 1 lit. a DSGVO (Einwilligung). Du
              kannst deine Einwilligung jederzeit mit einer formlosen Mail an
              welcome@buchwerk.info widerrufen; wir löschen deinen Eintrag
              dann unverzüglich.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-medium text-foreground">
              Hosting & Datenverarbeitung
            </h2>
            <p>
              Diese Seite wird über Vercel ausgeliefert. Die Warteliste wird
              in einer Supabase-Datenbank in der Region Frankfurt gespeichert.
              Mit beiden Anbietern bestehen bzw. werden vor Launch
              Auftragsverarbeitungsverträge nach Art. 28 DSGVO geschlossen.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-medium text-foreground">
              Keine Tracker, keine Werbe-Cookies
            </h2>
            <p>
              Buchwerk setzt im Platzhalter-Betrieb keine Analyse- oder
              Werbe-Cookies. Es werden keine Daten an Google Analytics,
              Facebook, Google Fonts oder vergleichbare Dienste übermittelt.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-medium text-foreground">
              Deine Rechte
            </h2>
            <p>
              Du hast jederzeit das Recht auf Auskunft, Berichtigung, Löschung,
              Einschränkung der Verarbeitung, Datenübertragbarkeit und
              Widerspruch (Art. 15–21 DSGVO) sowie das Recht, dich bei einer
              Aufsichtsbehörde zu beschweren.
            </p>
          </section>
        </div>

        <p className="mt-12 text-sm">
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
