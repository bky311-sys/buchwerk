import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/buchwerk/site-header";
import { LegalFooter } from "@/components/buchwerk/legal-footer";
import { ChapterProse } from "@/components/buchwerk/chapter-prose";
import { ARTIKEL, getArtikel } from "@/lib/ratgeber/articles";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://buchwerk.info";

export function generateStaticParams() {
  return ARTIKEL.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const artikel = getArtikel(slug);
  if (!artikel) return { title: "Artikel nicht gefunden — Buchwerk" };
  return {
    title: `${artikel.title} — Buchwerk Ratgeber`,
    description: artikel.description,
    openGraph: {
      title: artikel.title,
      description: artikel.description,
      type: "article",
    },
  };
}

export default async function RatgeberArtikelPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const artikel = getArtikel(slug);
  if (!artikel) notFound();

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: artikel.title,
    description: artikel.description,
    datePublished: artikel.published,
    inLanguage: "de",
    mainEntityOfPage: `${SITE_URL}/ratgeber/${artikel.slug}`,
    author: { "@type": "Organization", name: "Buchwerk", url: SITE_URL },
    publisher: { "@type": "Organization", name: "Buchwerk", url: SITE_URL },
  };

  const weitere = ARTIKEL.filter((a) => a.slug !== artikel.slug).slice(0, 3);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <SiteHeader />
      <main className="flex-1">
        <article className="mx-auto max-w-3xl px-6 py-16">
          <nav className="text-sm text-muted-foreground">
            <Link
              href="/ratgeber"
              className="underline underline-offset-4 hover:text-foreground"
            >
              ← Alle Ratgeber-Artikel
            </Link>
          </nav>
          <h1 className="font-display mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
            {artikel.title}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Buchwerk-Ratgeber ·{" "}
            {new Date(artikel.published).toLocaleDateString("de-DE", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>

          <div className="mt-8">
            <ChapterProse content={artikel.content} skipFirstHeading={false} />
          </div>

          <div className="mt-12 rounded-2xl border-2 border-primary bg-card p-6">
            <p className="font-display text-lg font-semibold">
              Fang mit deinem Thema an — kostenlos.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Gib dein Buchthema ein und Buchwerk erstellt dir gratis
              Titelvorschlag und Kapitel-Gliederung. Bezahlt wird erst, wenn du
              produzierst.
            </p>
            <div className="mt-4">
              <Button asChild size="lg">
                <Link href="/registrieren">Gliederung gratis erstellen</Link>
              </Button>
            </div>
          </div>

          {weitere.length > 0 ? (
            <section className="mt-12">
              <h2 className="font-display text-lg font-semibold">
                Weiterlesen
              </h2>
              <ul className="mt-4 space-y-3">
                {weitere.map((a) => (
                  <li key={a.slug}>
                    <Link
                      href={`/ratgeber/${a.slug}`}
                      className="text-sm font-medium text-primary underline underline-offset-4 hover:no-underline"
                    >
                      {a.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </article>
      </main>
      <LegalFooter />
    </>
  );
}
