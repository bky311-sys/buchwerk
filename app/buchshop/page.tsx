import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/buchwerk/wordmark";
import { getPublishedBooks, type ShopBook } from "@/lib/shop/queries";

export const metadata: Metadata = {
  title: "Buchshop — Buchwerk",
  description:
    "Bücher, die mit Buchwerk entstanden sind. Entdecken und direkt bei Amazon kaufen.",
};

// The shop must reflect newly published books on every request, so render
// dynamically rather than freezing a build-time snapshot.
export const dynamic = "force-dynamic";

export default async function BuchshopPage() {
  const books = await getPublishedBooks();

  return (
    <>
      <ShopHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Buchshop
          </p>
          <h1 className="font-display mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            Bücher aus dem Werk.
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Entstanden mit Buchwerk, veröffentlicht von ihren Autorinnen und
            Autoren. Stöbere und kauf direkt bei Amazon.
          </p>

          {books.length === 0 ? (
            <p className="mt-12 text-sm text-muted-foreground">
              Noch keine Bücher im Shop. Schau bald wieder vorbei.
            </p>
          ) : (
            <ul className="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
              {books.map((book) => (
                <li key={book.slug}>
                  <BookCard book={book} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
      <ShopFooter />
    </>
  );
}

function BookCard({ book }: { book: ShopBook }) {
  return (
    <Link href={`/buchshop/${book.slug}`} className="group block">
      <div className="overflow-hidden rounded-xl border border-border bg-muted shadow-sm transition-shadow group-hover:shadow-md">
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
      <h2 className="mt-3 text-sm font-semibold leading-snug text-foreground">
        {book.title}
      </h2>
      {book.author ? (
        <p className="mt-0.5 text-sm text-muted-foreground">{book.author}</p>
      ) : null}
    </Link>
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
