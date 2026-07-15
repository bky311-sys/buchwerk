import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/buchwerk/site-header";
import { ChapterProse } from "@/components/buchwerk/chapter-prose";
import { ReadingTracker } from "@/components/buchwerk/reading-tracker";
import { getReadableBookBySlug } from "@/lib/shop/reader-queries";
import { getBookReadingState } from "@/lib/shop/reading";
import { isSubscriber } from "@/lib/billing/access";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// The manuscript must never be indexed — it is the author's product, handed to a
// closed circle of readers, not published to the web.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

type Props = {
  params: Promise<{ slug: string; position: string }>;
};

export default async function ReaderPage({ params }: Props) {
  const { slug, position } = await params;
  const book = await getReadableBookBySlug(slug);
  if (!book) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const readerHref = `/buchshop/${slug}/lesen/${position}`;
  if (!user) redirect(`/anmelden?next=${encodeURIComponent(readerHref)}`);

  // Reading is a subscriber benefit. The author reads their own book for free —
  // it is their text, and it earns no progress anyway.
  const isOwn = book.ownerId === user.id;
  if (!isOwn && !(await isSubscriber(supabase, user.id))) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-2xl px-6 py-16">
          <h1 className="font-display text-2xl font-semibold">
            Lesen ist im Abo enthalten
          </h1>
          <p className="mt-3 text-muted-foreground">
            &bdquo;{book.title}&ldquo; kannst du hier vollständig lesen, wenn du ein Abo
            hast. Der Autor stellt sein Buch der Buchwerk-Leserschaft zur
            Verfügung — im Gegenzug hofft er auf eine ehrliche Bewertung.
          </p>
          <div className="mt-6 flex gap-3">
            <Button asChild>
              <Link href="/preise">Abo ansehen</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/buchshop/${slug}`}>Zurück zum Buch</Link>
            </Button>
          </div>
        </main>
      </>
    );
  }

  const pos = Number(position);
  const index = book.chapters.findIndex((c) => c.position === pos);
  if (!Number.isFinite(pos) || index === -1) notFound();

  const chapter = book.chapters[index];
  const prev = book.chapters[index - 1] ?? null;
  const next = book.chapters[index + 1] ?? null;

  const state = isOwn ? null : await getBookReadingState(book.id, user.id);

  return (
    <>
      <SiteHeader />
      {/* Own reading is not tracked: nothing to prove, nothing to review. */}
      {isOwn ? null : <ReadingTracker chapterId={chapter.id} />}

      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="flex items-baseline justify-between gap-4">
          <Link
            href={`/buchshop/${slug}`}
            className="text-sm text-muted-foreground underline underline-offset-2"
          >
            {book.title}
          </Link>
          <span className="text-sm text-muted-foreground">
            Kapitel {index + 1} von {book.chapters.length}
          </span>
        </div>

        <h1 className="font-display mt-6 text-3xl font-bold tracking-tight">
          {chapter.heading}
        </h1>

        <article className="mt-8">
          {chapter.content ? (
            <ChapterProse content={chapter.content} />
          ) : (
            <p className="text-muted-foreground">
              Dieses Kapitel hat noch keinen Text.
            </p>
          )}
        </article>

        <nav className="mt-14 flex items-center justify-between gap-4 border-t border-border pt-6">
          {prev ? (
            <Button asChild variant="outline">
              <Link href={`/buchshop/${slug}/lesen/${prev.position}`}>
                ← {prev.heading}
              </Link>
            </Button>
          ) : (
            <span />
          )}
          {next ? (
            <Button asChild>
              <Link href={`/buchshop/${slug}/lesen/${next.position}`}>
                {next.heading} →
              </Link>
            </Button>
          ) : (
            <Button asChild>
              <Link href={`/buchshop/${slug}#bewerten`}>
                Buch bewerten
              </Link>
            </Button>
          )}
        </nav>

        {state ? (
          <p className="mt-6 text-sm text-muted-foreground">
            {state.hasReadEnough
              ? "Du hast genug gelesen, um dieses Buch zu bewerten."
              : `Gelesen: ${state.chaptersRead} von ${state.chaptersTotal} Kapiteln. Ab ${state.chaptersRequired} kannst du bewerten.`}
          </p>
        ) : null}
      </main>
    </>
  );
}
