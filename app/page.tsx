import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/buchwerk/wordmark";
import { WaitlistForm } from "@/components/buchwerk/waitlist-form";

export default function Home() {
  return (
    <>
      <SiteHeader />
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

function SiteHeader() {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" aria-label="buchwerk – Startseite">
          <Wordmark />
        </Link>
        <nav className="flex items-center gap-2 sm:gap-3">
          <Button asChild variant="ghost" size="lg">
            <Link href="/anmelden">Anmelden</Link>
          </Button>
          <Button asChild size="lg">
            <Link href="/registrieren">Registrieren</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}

function HeroSection() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-5xl px-6 py-24 sm:py-32">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          Die deutschsprachige KI-Plattform fürs Self-Publishing
        </p>
        <h1 className="font-display mt-5 max-w-3xl text-5xl font-extrabold leading-[0.98] tracking-tight text-foreground sm:text-6xl md:text-7xl">
          Vom Thema zum fertigen Buch.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
          Manuskript, Cover und KDP-Listing in einem Workflow — statt in fünf
          Tools.
        </p>

        <div className="mt-10 space-y-3">
          <p className="text-sm text-foreground">
            Buchwerk ist noch nicht offen. Trag dich ein, dann melden wir uns.
          </p>
          <WaitlistForm source="landing_hero" />
        </div>

        <ol className="mt-16 grid gap-4 sm:grid-cols-3">
          {[
            {
              n: "01",
              title: "Thema eingeben",
              body: "Buchwerk schlägt Titel und Gliederung vor.",
            },
            {
              n: "02",
              title: "Kapitel schreiben",
              body: "KI schreibt, du feilst nach — Kapitel für Kapitel.",
            },
            {
              n: "03",
              title: "Bei KDP hochladen",
              body: "Cover, Listing und PDF — fertig zum Upload.",
            },
          ].map((step) => (
            <li
              key={step.n}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <span className="font-display block text-sm font-bold text-clay-strong">
                {step.n}
              </span>
              <h3 className="mt-2 text-base font-semibold text-foreground">
                {step.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
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
        <h2 className="font-display max-w-3xl text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Warum ein Buch heute länger dauert als es müsste.
        </h2>
        <ol className="mt-14 grid gap-6 md:grid-cols-3">
          {points.map((point, index) => (
            <li
              key={point.title}
              className="space-y-3 rounded-2xl border border-border bg-card p-6"
            >
              <span className="font-display block text-sm font-bold text-clay-strong tabular-nums">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="text-lg font-semibold text-foreground">
                {point.title}
              </h3>
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
    <section className="border-b border-border">
      <div className="mx-auto max-w-5xl px-6 py-20 sm:py-28">
        <h2 className="font-display max-w-3xl text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Ein Werkzeug. Vom Thema bis zum Hochladen.
        </h2>
        <ol className="mt-14 grid gap-6 md:grid-cols-3">
          {points.map((point, index) => (
            <li
              key={point.title}
              className="space-y-3 rounded-2xl border border-border bg-card p-6"
            >
              <span className="font-display block text-sm font-bold text-clay-strong tabular-nums">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="text-lg font-semibold text-foreground">
                {point.title}
              </h3>
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
        <h2 className="font-display max-w-3xl text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Vier Schritte, ein Werkzeug.
        </h2>
        <ol className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="space-y-3 border-t-2 border-primary pt-6"
            >
              <span className="font-display block text-sm font-bold text-primary tabular-nums">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="text-lg font-semibold text-foreground">
                {step.title}
              </h3>
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
    <section className="border-b border-border bg-card">
      <div className="mx-auto max-w-5xl px-6 py-20 sm:py-24">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Sei dabei, wenn Buchwerk öffnet.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
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
    <footer className="bg-background">
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
          <Link
            href="/agb"
            className="hover:text-foreground hover:underline underline-offset-4"
          >
            AGB
          </Link>
          <Link
            href="/widerruf"
            className="hover:text-foreground hover:underline underline-offset-4"
          >
            Widerruf
          </Link>
        </nav>
      </div>
    </footer>
  );
}
