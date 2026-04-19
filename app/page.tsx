import Link from "next/link";
import { WaitlistForm } from "@/components/buchwerk/waitlist-form";

export default function Home() {
  return (
    <>
      <main className="flex-1">
        <HeroSection />
        <ProblemSection />
        <SolutionSection />
        <HowItWorksSection />
        <FooterCtaSection />
      </main>
      <SiteFooter />
    </>
  );
}

function HeroSection() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-5xl px-6 py-24 sm:py-32">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Buchwerk.info — in Entwicklung
        </p>
        <h1 className="mt-6 text-4xl font-medium tracking-tight leading-[1.05] sm:text-5xl md:text-6xl">
          Vom Thema zum fertigen Buch.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed sm:text-xl">
          Die deutschsprachige KI-Plattform für Self-Publishing. Manuskript,
          Cover und KDP-Listing in einem Workflow — statt in fünf Tools.
        </p>

        <div className="mt-10 space-y-3">
          <p className="text-sm text-foreground">
            Buchwerk ist noch nicht offen. Trag dich ein, dann melden wir uns.
          </p>
          <WaitlistForm source="landing_hero" />
        </div>
      </div>
    </section>
  );
}

function ProblemSection() {
  const points = [
    {
      title: "Fünf Tools, fünf Dialekte.",
      body: "Du schreibst in Word, überarbeitest mit ChatGPT, bastelst das Cover in Canva, formatierst irgendwo dazwischen und lädst zu KDP hoch. Jeder Schritt ein eigenes Werkzeug, jedes Werkzeug mit eigenen Eigenarten.",
    },
    {
      title: "Generische KI spricht nicht Verlag.",
      body: "ChatGPT und Co. sind auf allgemeinen Texten trainiert. Klappentexte, Kategorien-Logik und KDP-Eigenheiten kennen sie nicht — du wirst zum Übersetzer zwischen Tool und deutschem Buchmarkt.",
    },
    {
      title: "Der letzte Meter frisst die Geduld.",
      body: "Wenn Manuskript und Cover endlich stehen, verlangt KDP noch Klappentext, Stichwörter, Kategorien und Metadaten. Genau hier verliert man die Lust — und das Buch bleibt im Entwurfsordner.",
    },
  ];

  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-5xl px-6 py-20 sm:py-28">
        <h2 className="max-w-3xl text-3xl font-medium tracking-tight sm:text-4xl">
          Warum ein Buch heute länger dauert als es müsste.
        </h2>
        <ol className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
          {points.map((point, index) => (
            <li key={point.title} className="space-y-3">
              <span className="block text-sm font-medium text-muted-foreground tabular-nums">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="text-lg font-medium">{point.title}</h3>
              <p className="text-base leading-relaxed text-muted-foreground">
                {point.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function SolutionSection() {
  const points = [
    {
      title: "Ein Workflow statt fünf Tools.",
      body: "Du gibst das Thema ein. Buchwerk schlägt Gliederung, Kapitel, Cover und KDP-Metadaten in derselben Sitzung vor. Du entscheidest an jeder Stelle mit — nichts wird hinter deinem Rücken fertig.",
    },
    {
      title: "Auf den deutschsprachigen Markt zugeschnitten.",
      body: "Prompts, Stilvorlagen und Kategorien sind für Deutschland, Österreich und die Schweiz gebaut. Kein übersetztes Englisch, keine amerikanische Rhetorik.",
    },
    {
      title: "KDP-fertig am Ende, nicht halbfertig.",
      body: "Am Schluss hast du Druck-PDF, EPUB und ein vollständiges KDP-Listing — Titel, Klappentext, Stichwörter, Kategorien, Preisvorschlag. Hochladen, veröffentlichen.",
    },
  ];

  return (
    <section className="border-b border-border bg-muted">
      <div className="mx-auto max-w-5xl px-6 py-20 sm:py-28">
        <h2 className="max-w-3xl text-3xl font-medium tracking-tight sm:text-4xl">
          Ein Werkzeug. Vom Thema bis zum Hochladen.
        </h2>
        <ol className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
          {points.map((point, index) => (
            <li key={point.title} className="space-y-3">
              <span className="block text-sm font-medium text-muted-foreground tabular-nums">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="text-lg font-medium">{point.title}</h3>
              <p className="text-base leading-relaxed text-muted-foreground">
                {point.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      title: "Thema & Richtung",
      body: "Du nennst Titel oder Thema. Buchwerk schlägt Zielgruppe, Tonalität und Umfang vor.",
    },
    {
      title: "Manuskript",
      body: "Gliederung entsteht, Kapitel werden Schritt für Schritt geschrieben. Du lektorierst mit, bis es sitzt.",
    },
    {
      title: "Cover",
      body: "Entwürfe mit sauberem Titelsatz. Du wählst eine Richtung, wir verfeinern bis zum finalen Cover.",
    },
    {
      title: "KDP-Listing",
      body: "Klappentext, Stichwörter, Kategorien, Preisempfehlung — kopierfertig für KDP.",
    },
  ];

  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-5xl px-6 py-20 sm:py-28">
        <h2 className="max-w-3xl text-3xl font-medium tracking-tight sm:text-4xl">
          Vier Schritte, ein Werkzeug.
        </h2>
        <ol className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="space-y-3 border-t border-border pt-6"
            >
              <span className="block text-sm font-medium text-primary tabular-nums">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="text-lg font-medium">{step.title}</h3>
              <p className="text-base leading-relaxed text-muted-foreground">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function FooterCtaSection() {
  return (
    <section className="bg-muted">
      <div className="mx-auto max-w-5xl px-6 py-20 sm:py-24">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-medium tracking-tight sm:text-4xl">
            Sei dabei, wenn Buchwerk öffnet.
          </h2>
          <p className="mt-4 text-base text-muted-foreground leading-relaxed">
            Wir melden uns einmalig zum Start. Keine Werbung, kein Newsletter,
            keine Weitergabe deiner Adresse.
          </p>
          <div className="mt-8">
            <WaitlistForm source="landing_footer" />
          </div>
        </div>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-10 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Buchwerk — Benjamin Koch</p>
        <nav className="flex gap-6">
          <Link
            href="/impressum"
            className="hover:text-foreground hover:underline underline-offset-4"
          >
            Impressum
          </Link>
          <Link
            href="/datenschutz"
            className="hover:text-foreground hover:underline underline-offset-4"
          >
            Datenschutz
          </Link>
        </nav>
      </div>
    </footer>
  );
}
