import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/buchwerk/site-header";
import { BookCover } from "@/components/buchwerk/book-cover";
import { BookBackCover } from "@/components/buchwerk/book-back-cover";
import { Stars } from "@/components/buchwerk/stars";
import { StatusBadge } from "@/components/buchwerk/status-badge";
import { ReviewWidget } from "@/components/buchwerk/review-widget";
import {
  ReviewDisclosure,
  ReviewAggregateNote,
} from "@/components/buchwerk/review-disclosure";
import { getPublishedBookBySlug } from "@/lib/shop/queries";
import { buildAmazonUrl } from "@/lib/shop/amazon";
import { createClient } from "@/lib/supabase/server";
import { getBookReadingState } from "@/lib/shop/reading";
import { isSubscriber } from "@/lib/billing/access";
import {
  getApprovedReviews,
  getUserReviewState,
  summarize,
} from "@/lib/shop/reviews";

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

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [reviews, ownRow, reviewState, readingState, subscriber] =
    await Promise.all([
      getApprovedReviews(book.id),
      // RLS returns the project row only to its owner → detects the author's own book.
      user
        ? supabase.from("projects").select("id").eq("id", book.id).maybeSingle()
        : Promise.resolve({ data: null }),
      user
        ? getUserReviewState(supabase, book.id, user.id)
        : Promise.resolve(null),
      user ? getBookReadingState(book.id, user.id) : Promise.resolve(null),
      user ? isSubscriber(supabase, user.id) : Promise.resolve(false),
    ]);
  const summary = summarize(reviews);
  const isOwnBook = Boolean(ownRow?.data);
  const loginHref = `/anmelden?weiter=${encodeURIComponent(`/buchshop/${slug}`)}`;

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <Link
            href="/buchshop"
            className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            ← Zum Buchshop
          </Link>

          {/* items-start: grid items stretch to the row height by default, which
              blew the cover column up to the height of the text column — the
              motif sat at the top, the muted background filled the rest, and the
              title band (absolute bottom-0) ended up hundreds of px below the
              image instead of on it. */}
          <div className="mt-8 grid items-start gap-10 sm:grid-cols-[minmax(0,240px)_1fr]">
            <div className="space-y-4">
              <BookCover
                imageUrl={book.coverUrl}
                title={book.title}
                author={book.author}
                styleKey={book.coverStyle}
              />
              {book.coverUrl ? (
                <BookBackCover
                  imageUrl={book.coverUrl}
                  title={book.title}
                  blurb={book.description}
                />
              ) : null}
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

              {summary.count > 0 ? (
                <div className="mt-3">
                  <div className="flex items-center gap-2">
                    <Stars value={summary.average} />
                    <span className="text-sm text-muted-foreground">
                      {summary.average.toFixed(1)} ·{" "}
                      {summary.count}{" "}
                      {summary.count === 1 ? "Bewertung" : "Bewertungen"}
                    </span>
                  </div>
                  <ReviewAggregateNote />
                </div>
              ) : null}

              <div className="mt-6 flex flex-wrap gap-3">
                {book.isReadable && !isOwnBook ? (
                  <Button asChild size="lg">
                    <Link href={`/buchshop/${slug}/lesen`}>
                      Hier lesen
                    </Link>
                  </Button>
                ) : null}
                {book.amazonUrl ? (
                  <Button
                    asChild
                    size="lg"
                    variant={book.isReadable && !isOwnBook ? "outline" : "default"}
                  >
                    <a
                      href={buildAmazonUrl(book.amazonUrl)}
                      target="_blank"
                      rel="sponsored nofollow noopener"
                    >
                      Bei Amazon kaufen
                    </a>
                  </Button>
                ) : null}
              </div>

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

          <div className="mt-14 space-y-6">
            <ReviewDisclosure />
            <ReviewWidget
              bookId={book.id}
              slug={slug}
              loggedIn={Boolean(user)}
              isOwnBook={isOwnBook}
              isReadable={book.isReadable}
              isSubscriber={subscriber}
              chaptersRead={readingState?.chaptersRead ?? 0}
              chaptersTotal={readingState?.chaptersTotal ?? 0}
              chaptersRequired={readingState?.chaptersRequired ?? 0}
              hasReadEnough={readingState?.hasReadEnough ?? false}
              hasReviewed={reviewState?.hasReviewed ?? false}
              reviewStatus={reviewState?.reviewStatus ?? null}
              rejectionReason={reviewState?.rejectionReason ?? null}
              loginHref={loginHref}
            />

            {reviews.length > 0 ? (
              <section>
                <h2 className="font-display text-lg font-semibold">
                  Bewertungen
                </h2>
                <ul className="mt-4 space-y-4">
                  {reviews.map((r) => (
                    <li
                      key={r.id}
                      className="rounded-2xl border border-border bg-card p-5"
                    >
                      <div className="flex items-center gap-2">
                        <Stars value={r.rating} />
                        {r.rewarded ? (
                          <StatusBadge intent="neutral">
                            Punkte-Bewertung
                          </StatusBadge>
                        ) : null}
                      </div>
                      {r.body ? (
                        <p className="mt-2 text-sm leading-relaxed text-foreground">
                          {r.body}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        </div>
      </main>
      <ShopFooter />
    </>
  );
}

function ShopFooter() {
  return (
    <footer className="bg-background">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-10 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {new Date().getFullYear()} Buchwerk — Benjamin Koch
          <span className="mt-1 block text-xs">
            Als Amazon-Partner verdienen wir an qualifizierten Käufen.
          </span>
        </p>
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
