import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Impressum — Buchwerk.info",
  description: "Anbieterkennzeichnung und Kontakt für Buchwerk.info.",
};

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

        <div className="mt-10 space-y-6 text-base leading-relaxed text-muted-foreground">
          <p className="rounded-lg border border-border bg-muted p-4 text-sm text-foreground">
            Dieses Impressum wird vor dem öffentlichen Launch final erstellt
            und durch einen juristisch geprüften Text ersetzt. Bis dahin
            befindet sich Buchwerk.info im Platzhalter-Betrieb.
          </p>

          <section className="space-y-2">
            <h2 className="text-lg font-medium text-foreground">
              Anbieter nach §5 TMG
            </h2>
            <p>
              [NAME]
              <br />
              [STRASSE HAUSNUMMER]
              <br />
              [PLZ ORT]
              <br />
              Deutschland
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-medium text-foreground">Kontakt</h2>
            <p>
              Email: welcome@buchwerk.info
              <br />
              Telefon: [TELEFONNUMMER]
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-medium text-foreground">
              Verantwortlich für den Inhalt nach §55 Abs. 2 RStV
            </h2>
            <p>[NAME], Anschrift wie oben.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-medium text-foreground">
              Umsatzsteuer-ID
            </h2>
            <p>[USt-ID oder Hinweis auf Kleinunternehmerregelung §19 UStG]</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-medium text-foreground">Haftung</h2>
            <p>
              Die Inhalte dieser Seite wurden mit größter Sorgfalt erstellt.
              Für Richtigkeit, Vollständigkeit und Aktualität kann jedoch
              keine Gewähr übernommen werden.
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
