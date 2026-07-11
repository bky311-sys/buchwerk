import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/buchwerk/wordmark";
import { HeroLeadForm } from "@/components/buchwerk/hero-lead-form";
import { ProductPreview } from "@/components/buchwerk/product-preview";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <HeroSection />
        <TrustBar />
        <ProblemSection />
        <SolutionSection />
        <HowItWorksSection />
        <PricingSection />
        <BuchshopTeaser />
        <FaqSection />
        <FounderSection />
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
        <nav className="flex items-center gap-1 sm:gap-3">
          <Button
            asChild
            variant="ghost"
            size="lg"
            className="hidden sm:inline-flex"
          >
            <Link href="/buchshop">Buchshop</Link>
          </Button>
          <Button asChild variant="ghost" size="lg">
            <Link href="/anmelden">Anmelden</Link>
          </Button>
          <Button asChild size="lg">
            <Link href="/registrieren">Kostenlos starten</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}

function HeroSection() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto grid max-w-5xl gap-12 px-6 py-20 sm:py-28 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Die deutschsprachige KI-Plattform fürs Self-Publishing
          </p>
          <h1 className="font-display mt-5 text-5xl font-extrabold leading-[0.98] tracking-tight text-foreground sm:text-6xl">
            Vom Thema zum fertigen Buch.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Manuskript, Cover und KDP-Listing in einem Workflow — statt in fünf
            Tools. Gib dein Thema ein, den Rest baust du mit Buchwerk Schritt für
            Schritt.
          </p>
          <div className="mt-8">
            <HeroLeadForm />
          </div>
        </div>
        <div className="lg:pl-4">
          <ProductPreview />
        </div>
      </div>
    </section>
  );
}

function TrustBar() {
  const items = [
    "DSGVO — Hosting in Frankfurt",
    "Kein Abo-Zwang",
    "Deine Rechte bleiben bei dir",
    "Widerrufsrecht transparent",
  ];
  return (
    <section className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-8 gap-y-3 px-6 py-5 text-sm text-muted-foreground">
        {items.map((item) => (
          <span key={item} className="inline-flex items-center gap-2">
            <span className="text-primary">✓</span>
            {item}
          </span>
        ))}
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

function PricingSection() {
  return (
    <section className="border-b border-border bg-card">
      <div className="mx-auto max-w-5xl px-6 py-20 sm:py-28">
        <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Fair und ohne Abo-Falle.
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
          Thema und Gliederung sind kostenlos — du siehst erst, was Buchwerk aus
          deiner Idee macht, und zahlst dann. Bezahlung sicher über Stripe.
        </p>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          <div className="relative flex flex-col rounded-2xl border-2 border-primary bg-background p-7">
            <span className="absolute -top-3 left-7 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
              Empfohlen fürs erste Buch
            </span>
            <h3 className="text-sm font-semibold text-muted-foreground">
              Einzelnes Buch
            </h3>
            <p className="font-display mt-1.5 text-4xl font-bold text-foreground">
              19,99 €
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Einmalig. Schaltet Kapitel-Schreiben, Cover, KDP-Listing und
              PDF/EPUB für dieses Buch dauerhaft frei.
            </p>
            <div className="mt-6">
              <Button asChild size="lg" className="w-full">
                <Link href="/registrieren">Kostenlos starten</Link>
              </Button>
            </div>
          </div>

          <div className="flex flex-col rounded-2xl border border-border bg-background p-7">
            <h3 className="text-sm font-semibold text-muted-foreground">
              Abo für Vielschreiber
            </h3>
            <p className="font-display mt-1.5 text-4xl font-bold text-foreground">
              29,99{" "}
              <span className="text-base font-medium text-muted-foreground">
                € / Monat
              </span>
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Bis zu 10 Bücher pro Monat freischalten. Monatlich kündbar. Punkte
              aus Bewertungen inklusive.
            </p>
            <div className="mt-6">
              <Button asChild size="lg" variant="secondary" className="w-full">
                <Link href="/registrieren">Abo im Konto starten</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function BuchshopTeaser() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-5xl px-6 py-20 sm:py-24">
        <div className="rounded-2xl border border-border bg-card p-8 sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Buchshop
          </p>
          <h2 className="font-display mt-3 max-w-2xl text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Bücher aus dem Werk.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Autorinnen und Autoren veröffentlichen ihre mit Buchwerk gebauten
            Bücher im Buchshop — vorgestellt, bewertet und direkt bei Amazon
            erhältlich. Sieh dir an, was hier entsteht.
          </p>
          <div className="mt-6">
            <Button asChild size="lg" variant="outline">
              <Link href="/buchshop">Zum Buchshop</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function FaqSection() {
  const faqs = [
    {
      q: "Darf ich ein KI-Buch bei Amazon KDP veröffentlichen?",
      a: "Ja. Amazon KDP erlaubt KI-gestützte Bücher, verlangt bei der Veröffentlichung aber, dass du KI-generierte Inhalte angibst. Du bleibst der verantwortliche Autor — Buchwerk hilft beim Erstellen, du entscheidest und veröffentlichst.",
    },
    {
      q: "Gehören mir die Rechte am Text?",
      a: "Ja. Das fertige Manuskript gehört dir. Du veröffentlichst und verkaufst es unter deinem Namen und entscheidest über Preis und Vertrieb.",
    },
    {
      q: "Wird das nicht einfach generischer KI-Text?",
      a: "Du steuerst jeden Schritt: Gliederung, Kapitel, Lektorat. Buchwerk schlägt vor, du feilst nach, bis es sitzt — nichts wird hinter deinem Rücken fertig. Die Qualität hängt an deinem Thema und deinen Entscheidungen.",
    },
    {
      q: "Was kostet mich das wirklich?",
      a: "Thema und Gliederung sind kostenlos. Die Produktion eines Buchs kostet einmalig 19,99 € — kein Abo-Zwang. Wer viel schreibt, nimmt das Abo für 29,99 €/Monat (bis zu 10 Bücher).",
    },
  ];

  return (
    <section className="border-b border-border bg-card">
      <div className="mx-auto max-w-5xl px-6 py-20 sm:py-28">
        <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Was Autorinnen und Autoren fragen.
        </h2>
        <dl className="mt-12 grid gap-x-10 gap-y-8 md:grid-cols-2">
          {faqs.map((faq) => (
            <div key={faq.q}>
              <dt className="text-lg font-semibold text-foreground">{faq.q}</dt>
              <dd className="mt-2 text-base leading-relaxed text-muted-foreground">
                {faq.a}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function FounderSection() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-5xl px-6 py-20 sm:py-24">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Wer dahinter steckt
          </p>
          <h2 className="font-display mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Kein Konzern. Eine Werkstatt.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Ich bin Benjamin und baue Buchwerk als kleine Ein-Personen-Werkstatt
            in Deutschland — weil ich es leid war, für ein einziges Buch fünf
            Tools zu jonglieren. Buchwerk ist das Werkzeug, das ich mir selbst
            gewünscht hätte: klar, ehrlich im Preis, und du behältst die
            Kontrolle. Fragen landen bei einem echten Menschen, nicht in einem
            Ticket-Nirwana.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            Anbieter und Kontakt findest du im{" "}
            <Link
              href="/impressum"
              className="text-foreground underline underline-offset-4 hover:no-underline"
            >
              Impressum
            </Link>
            .
          </p>
        </div>
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
            Fang mit deinem Thema an.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Gib ein, worum es gehen soll — du bekommst kostenlos Titelvorschlag
            und Gliederung. Erst wenn du produzierst, zahlst du.
          </p>
          <div className="mt-8">
            <HeroLeadForm />
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
        <nav className="flex flex-wrap gap-6">
          <Link
            href="/buchshop"
            className="hover:text-foreground hover:underline underline-offset-4"
          >
            Buchshop
          </Link>
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
