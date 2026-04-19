import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Impressum — Buchwerk.info",
  description: "Anbieterkennzeichnung und Kontakt für Buchwerk.info.",
};

const sectionTitleClass = "text-lg font-medium text-foreground";
const linkClass =
  "underline underline-offset-4 hover:text-foreground break-words";

export default function ImpressumPage() {
  return (
    <main className="flex-1">
      <article className="mx-auto max-w-2xl px-6 py-20 sm:py-28">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Buchwerk.info
        </p>
        <h1 className="mt-4 text-3xl font-medium tracking-tight sm:text-4xl">
          Impressum
        </h1>

        <div className="mt-10 space-y-8 text-base leading-relaxed text-muted-foreground">
          <section className="space-y-2">
            <h2 className={sectionTitleClass}>Angaben gemäß § 5 TMG</h2>
            <p>
              Benjamin Koch
              <br />
              Friedrichstraße 33
              <br />
              58791 Werdohl
              <br />
              Deutschland
            </p>
          </section>

          <section className="space-y-2">
            <h2 className={sectionTitleClass}>Kontakt</h2>
            <p>E-Mail: welcome@buchwerk.info</p>
          </section>

          <section className="space-y-2">
            <h2 className={sectionTitleClass}>
              Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV
            </h2>
            <p>
              Benjamin Koch
              <br />
              Friedrichstraße 33
              <br />
              58791 Werdohl
              <br />
              Deutschland
            </p>
          </section>

          <section className="space-y-2">
            <h2 className={sectionTitleClass}>EU-Streitschlichtung</h2>
            <p>
              Die Europäische Kommission stellt eine Plattform zur
              Online-Streitbeilegung (OS) bereit:{" "}
              <a
                href="https://ec.europa.eu/consumers/odr/"
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                https://ec.europa.eu/consumers/odr/
              </a>
            </p>
            <p>Unsere E-Mail-Adresse finden Sie oben im Impressum.</p>
          </section>

          <section className="space-y-2">
            <h2 className={sectionTitleClass}>
              Verbraucherstreitbeilegung / Universalschlichtungsstelle
            </h2>
            <p>
              Wir sind nicht verpflichtet und nicht bereit, an
              Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle
              teilzunehmen.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className={sectionTitleClass}>Haftung für Inhalte</h2>
            <p>
              Als Diensteanbieter sind wir gemäß § 7 Abs. 1 TMG für eigene
              Inhalte auf diesen Seiten nach den allgemeinen Gesetzen
              verantwortlich.
            </p>
            <p>
              Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht
              verpflichtet, übermittelte oder gespeicherte fremde Informationen
              zu überwachen.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className={sectionTitleClass}>Haftung für Links</h2>
            <p>
              Unser Angebot enthält ggf. Links zu externen Websites Dritter,
              auf deren Inhalte wir keinen Einfluss haben. Für diese Inhalte
              ist stets der jeweilige Anbieter verantwortlich.
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
