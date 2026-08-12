import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/buchwerk/site-header";
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
        <ChatGptComparisonSection />
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


function HeroSection() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto grid max-w-5xl gap-12 px-6 py-20 sm:py-28 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Das Self-Publishing-Studio — Ratgeber, Sachbücher &amp; Workbooks
          </p>
          <h1 className="font-display mt-5 text-5xl font-extrabold leading-[0.98] tracking-tight text-foreground sm:text-6xl">
            Dein Buch. Recherchiert, druckfertig, live auf Amazon.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Buchwerk prüft deine Nische mit echten Amazon-Zahlen, recherchiert im
            Web, schreibt ein vollständiges Manuskript und liefert das komplette
            KDP-Paket: druckfertiges PDF, Cover, Listing. Danach findet dein Buch
            im Buchshop seine ersten Leser — und du siehst täglich, wie es sich
            bei Amazon schlägt.
          </p>
          <div className="mt-8">
            <HeroLeadForm />
          </div>
        </div>
        <div className="min-w-0 lg:pl-4">
          <ProductPreview />
        </div>
      </div>
    </section>
  );
}

function TrustBar() {
  const items = [
    "Recherchiert mit echten Quellen",
    "Vollständiges Manuskript, kein Gerüst",
    "Qualitäts- und Quellencheck vor dem Export",
    "Du behältst alle Rechte",
    "DSGVO — Server in Frankfurt",
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
      title: "Der Anfang ist zu groß.",
      body: "Ein Sachbuch heißt: recherchieren, gliedern, Kapitel um Kapitel schreiben, überarbeiten. Wochen an Abenden. Die meisten Buchideen sterben genau hier — vor der ersten Seite.",
    },
    {
      title: "Reine KI erfindet, was sie nicht weiß.",
      body: "ChatGPT und Co. klingen souverän, erfinden aber Zahlen, Studien und Quellen. Für ein Buch, das jemand ernst nehmen soll, ist das ein echtes Risiko.",
    },
    {
      title: "Und dann kommt Amazon KDP.",
      body: "Ist der Text fertig, will KDP noch Cover, Klappentext, Stichwörter, Kategorien und Formatierung. Genau hier verliert man die Lust — und das Buch bleibt im Entwurfsordner.",
    },
  ];

  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-5xl px-6 py-20 sm:py-28">
        <h2 className="font-display max-w-3xl text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Warum die meisten Buchideen nie ein Buch werden.
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
      title: "Erst recherchieren, dann schreiben.",
      body: "Buchwerk durchsucht das Web, sammelt belegte Fakten, Zahlen und Quellen und schreibt die Kapitel darauf auf. Kein erfundenes Wissen, sondern eine nachvollziehbare Grundlage.",
    },
    {
      title: "Ein ganzes Manuskript, kein Stichwort-Gerüst.",
      body: "Du bekommst ausgeschriebene Kapitel mit echtem Umfang — ein vollständiges Manuskript, das man wirklich lesen kann. Du liest mit und überarbeitest, bis es sitzt.",
    },
    {
      title: "KDP-fertig bis zum Download.",
      body: "Am Ende hast du das Manuskript als druckfertiges PDF, ein Cover und ein komplettes KDP-Listing — Titel, Klappentext, Stichwörter, Kategorien, Preisvorschlag. Hochladen, veröffentlichen.",
    },
  ];

  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-5xl px-6 py-20 sm:py-28">
        <h2 className="font-display max-w-3xl text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Buchwerk nimmt dir das Schwere ab — nicht die Kontrolle.
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
      title: "Thema & Gliederung",
      body: "Du nennst dein Thema. Buchwerk erstellt Titelvorschlag und Kapitel-Gliederung — kostenlos, bevor du dich entscheidest.",
    },
    {
      title: "Recherche & Kapitel",
      body: "Buchwerk recherchiert im Web und schreibt die Kapitel darauf auf. Ton, Länge und Inhalt steuerst du mit.",
    },
    {
      title: "Cover",
      body: "Cover-Entwürfe mit sauberem Titelsatz. Du wählst eine Richtung, wir verfeinern bis zum finalen Cover.",
    },
    {
      title: "Listing & Download",
      body: "Klappentext, Stichwörter, Kategorien und Preisempfehlung — kopierfertig für KDP. Das Manuskript lädst du als PDF herunter.",
    },
  ];

  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-5xl px-6 py-20 sm:py-28">
        <h2 className="font-display max-w-3xl text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Vier Schritte bis zum fertigen Buch.
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

// Der Einwand, den jeder Besucher im Kopf hat („das mache ich doch mit
// ChatGPT"), wird offensiv beantwortet statt umschifft. Bewusst fair im Ton —
// wir gewinnen über das Drumherum, nicht über „ChatGPT ist schlecht".
function ChatGptComparisonSection() {
  const rows = [
    {
      feature: "Nischen-Check vor dem Schreiben",
      buchwerk:
        "Echte Amazon-Zahlen: Marktführer, Bewertungen, Preise — bevor du eine Zeile schreibst.",
      chatgpt: "Schätzt den Markt aus dem Gedächtnis — oft daneben.",
    },
    {
      feature: "Recherche & Quellen",
      buchwerk:
        "Web-Recherche vor jedem Kapitel, mit nachvollziehbarer Quellenliste.",
      chatgpt: "Erfindet Zahlen und Studien, wenn es etwas nicht weiß.",
    },
    {
      feature: "Druckfertiges Buch",
      buchwerk:
        "KDP-konformes Manuskript-PDF und EPUB — Ränder, Titelei, Impressum stimmen.",
      chatgpt:
        "Liefert Text. Formatieren, Ränder, Beschnitt: dein Problem — und der häufigste Grund, warum KDP Uploads ablehnt.",
    },
    {
      feature: "Cover & Listing",
      buchwerk:
        "Cover-Entwürfe plus Klappentext, Kategorien und Keywords aus echten Amazon-Suchvorschlägen.",
      chatgpt: "Kein Cover. Keywords sind geraten.",
    },
    {
      feature: "Qualitätscheck",
      buchwerk:
        "Automatische Prüfung auf Widersprüche, Wiederholungen und tote Quellen — vor dem Export.",
      chatgpt: "Korrekturlesen musst du selbst organisieren.",
    },
    {
      feature: "Nach der Veröffentlichung",
      buchwerk:
        "Erste Leser und Bewertungen über den Buchshop, täglicher Blick auf deinen Amazon-Rang.",
      chatgpt: "Nichts. Ab dem Upload bist du allein.",
    },
  ];

  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-5xl px-6 py-20 sm:py-28">
        <h2 className="font-display max-w-3xl text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          „Das mache ich doch einfach mit ChatGPT.“
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
          Kannst du — den Text. Aber ein verkaufsfähiges Buch besteht zu 20 %
          aus Text und zu 80 % aus allem drumherum. Genau dieses Drumherum ist
          Buchwerk:
        </p>

        <ul className="mt-10 space-y-3">
          {rows.map((row) => (
            <li
              key={row.feature}
              className="grid gap-x-6 gap-y-2 rounded-2xl border border-border bg-card p-5 sm:grid-cols-[200px_1fr_1fr] sm:items-baseline"
            >
              <h3 className="text-sm font-semibold text-foreground">
                {row.feature}
              </h3>
              <p className="text-sm leading-relaxed">
                <span className="font-semibold text-success">✓ Buchwerk: </span>
                <span className="text-muted-foreground">{row.buchwerk}</span>
              </p>
              <p className="text-sm leading-relaxed">
                <span className="font-semibold text-clay-strong">
                  ✗ ChatGPT:{" "}
                </span>
                <span className="text-muted-foreground">{row.chatgpt}</span>
              </p>
            </li>
          ))}
        </ul>

        <p className="mt-8 max-w-2xl text-base font-medium text-foreground">
          Und der Preis? Ein komplettes Buch bei Buchwerk kostet einmalig
          19,99 € — weniger als ein einziger Monat ChatGPT&nbsp;Plus.
        </p>
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
          deiner Idee macht, und zahlst dann. Ein komplettes Buch kostet weniger
          als ein Monat ChatGPT&nbsp;Plus — und am Ende hältst du ein
          hochladbares Buchpaket in der Hand. Bezahlung sicher über Stripe.
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
              Einmalig. Schaltet Recherche, Kapitel-Schreiben, Cover, KDP-Listing
              und den Manuskript-Download für dieses Buch dauerhaft frei.
            </p>
            <div className="mt-6">
              <Button asChild size="lg" className="w-full">
                <Link href="/registrieren">Mit diesem Buch starten</Link>
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
            Sieh, was andere hier schon gebaut haben.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Autorinnen und Autoren veröffentlichen ihre mit Buchwerk gebauten
            Bücher im Buchshop — vorgestellt, bewertet und direkt bei Amazon
            erhältlich. Der beste Beweis, dass am Ende ein echtes Buch steht.
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

// Modulebene statt Komponentenscope: dieselben Fragen speisen die sichtbare
// FAQ-Sektion UND das FAQPage-Schema (Chance auf Rich Results in Google).
const FAQS = [
    {
      q: "Darf ich ein KI-Buch bei Amazon KDP veröffentlichen?",
      a: "Ja. Amazon KDP erlaubt KI-gestützte Bücher, verlangt bei der Veröffentlichung aber, dass du KI-generierte Inhalte angibst. Du bleibst der verantwortliche Autor — Buchwerk hilft beim Erstellen, du entscheidest und veröffentlichst.",
    },
    {
      q: "Warum nicht einfach ChatGPT nehmen?",
      a: "ChatGPT schreibt dir Text — aber kein Buch. Buchwerk prüft vorher die Nische mit echten Amazon-Zahlen, recherchiert mit Quellen, liefert ein KDP-konformes Druck-PDF, Cover und Listing mit Keywords aus echten Suchvorschlägen, prüft die Qualität vor dem Export und bringt deinem Buch im Buchshop die ersten Leser. Ein Buch kostet einmalig 19,99 € — weniger als ein Monat ChatGPT Plus.",
    },
    {
      q: "Wird das nicht einfach generischer KI-Text?",
      a: "Zwei Dinge unterscheiden Buchwerk: Es recherchiert vorab im Web und stützt die Kapitel auf belegte Quellen statt auf Erfundenes. Und du steuerst jeden Schritt — Gliederung, Kapitel, Überarbeitung. Buchwerk schlägt vor, du feilst nach, bis es sitzt.",
    },
    {
      q: "Wie lang wird mein Buch?",
      a: "Buchwerk schreibt ein vollständiges Manuskript — mehrere tausend Wörter über alle Kapitel, kein dünnes Gerüst. Wie umfangreich genau, bestimmst du über Thema, Gliederung und die Kapitel, die du schreiben lässt.",
    },
    {
      q: "Gehören mir die Rechte am Text?",
      a: "Ja. Das fertige Manuskript gehört dir. Du veröffentlichst und verkaufst es unter deinem Namen und entscheidest über Preis und Vertrieb.",
    },
    {
      q: "Was kostet mich das wirklich?",
      a: "Thema und Gliederung sind kostenlos. Die Produktion eines Buchs kostet einmalig 19,99 € — kein Abo-Zwang. Wer viel schreibt, nimmt das Abo für 29,99 €/Monat — bis zu 10 Bücher pro Monat (faire Nutzung).",
    },
];

function FaqSection() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  };

  return (
    <section className="border-b border-border bg-card">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div className="mx-auto max-w-5xl px-6 py-20 sm:py-28">
        <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Was Autorinnen und Autoren fragen.
        </h2>
        <dl className="mt-12 grid gap-x-10 gap-y-8 md:grid-cols-2">
          {FAQS.map((faq) => (
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
            in Deutschland — weil zu viele gute Buchideen an allem scheitern außer
            am Schreiben selbst. Buchwerk ist das Werkzeug, das ich mir dafür
            gewünscht hätte: gründlich, ehrlich im Preis, und du behältst die
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
          <Link
            href="/widerruf-erklaeren"
            className="hover:text-foreground hover:underline underline-offset-4"
          >
            Vertrag widerrufen
          </Link>
        </nav>
      </div>
    </footer>
  );
}
