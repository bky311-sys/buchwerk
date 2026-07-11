import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/buchwerk/wordmark";
import { getPublishedBookBySlug } from "@/lib/shop/queries";
import { buildAmazonUrl } from "@/lib/shop/amazon";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const book = await getPublishedBookBySlug(slug);
  if (!book) return { title: "Buch nicht gefunden — Buchwerk" };

  const description =
    book.subtitle ??
    book.description?.slice(0, 155) ??
    `${book.title} im Buchwerk-Buchshop.`;
  return {
    title: `${book.title} — Buchshop`,
    description,
    openGraph: book.coverUrl ? { images: [book.coverUrl] } : undefined,
  };
}

export default async function BuchDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const book = await getPublishedBookBySlug(slug);
  if (!book) notFound();

  return (
    <>
      <ShopHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <Link
            href="/buchshop"
            className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            ← Zum Buchshop
          </Link>

          <div className="mt-8 grid gap-10 sm:grid-cols-[minmax(0,240px)_1fr]">
            <div className="overflow-hidden rounded-xl border border-border bg-muted shadow-sm">
              {book.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={book.coverUrl}
                  alt={`Cover: ${book.title}`}
                  className="aspect-[2/3] w-full object-cover"
                />
              ) : (
                <div className="flex aspect-[2/3] w-full items-center justify-center p-4 text-center">
                  <span className="font-display text-sm font-semibold text-muted-foreground">
                    {book.title}
                  </span>
                </div>
              )}
            </div>

            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                {book.title}
              </h1>
              {book.subtitle ? (
                <p className="mt-2 text-lg text-muted-foreground">
                  {book.subtitle}
                </p>
              ) : null}
              {book.author ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  von <span className="text-foreground">{book.author}</span>
                </p>
              ) : null}

              {book.amazonUrl ? (
                <div className="mt-6">
                  <Button asChild size="lg">
                    <a
                      href={buildAmazonUrl(book.amazonUrl)}
                      target="_blank"
                      rel="sponsored nofollow noopener"
                    >
                      Bei Amazon kaufen
                    </a>
                  </Button>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Affiliate-Link — der Kauf läuft bei Amazon.
                  </p>
                </div>
              ) : null}

              {book.description ? (
                <div className="mt-8">
                  <h2 className="font-display text-lg font-semibold">
                    Über das Buch
                  </h2>
                  <p className="mt-2 whitespace-pre-wrap text-base leading-relaxed text-foreground">
                    {book.description}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </main>
      <ShopFooter />
    </>
  );
}

function ShopHeader() {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" aria-label="buchwerk – Startseite">
          <Wordmark />
        </Link>
        <nav className="flex items-center gap-2 sm:gap-3">
          <Button asChild variant="ghost" size="lg">
            <Link href="/buchshop">Buchshop</Link>
          </Button>
          <Button asChild size="lg">
            <Link href="/registrieren">Registrieren</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}

function ShopFooter() {
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
        </nav>
      </div>
    </footer>
  );
}
