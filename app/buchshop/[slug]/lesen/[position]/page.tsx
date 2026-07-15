import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/buchwerk/site-header";
import { ChapterProse } from "@/components/buchwerk/chapter-prose";
import { ReadingBar } from "@/components/buchwerk/reading-bar";
import { getReadableBookBySlug } from "@/lib/shop/reader-queries";
import { getBookReadingState, getChapterProgress } from "@/lib/shop/reading";
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
            &bdquo;{book.title}&ldquo; kannst du hier vollständig lesen, wenn du
            ein Abo hast. Der Autor stellt sein Buch der Buchwerk-Leserschaft zur
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

  const [state, progress] = await Promise.all([
    isOwn ? Promise.resolve(null) : getBookReadingState(book.id, user.id),
    isOwn
      ? Promise.resolve(null)
      : getChapterProgress(chapter.id, user.id, chapter.content),
  ]);
  const readIds = new Set(state?.readChapterIds ?? []);

  return (
    <>
      <SiteHeader />

      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="flex items-baseline justify-between gap-4">
          <Link
            href={`/buchshop/${slug}`}
            className="text-sm text-muted-foreground underline underline-offset-2"
          >
            ← {book.title}
          </Link>
          <span className="text-sm text-muted-foreground">
            Kapitel {index + 1} von {book.chapters.length}
          </span>
        </div>

        {/* Chapter strip. A chapter turns green once it actually counts — the
            honest version of "colour the lines as you read": we measure per
            chapter (time + scroll depth), never per line, so this is exactly as
            precise as our data and no more. */}
        {state ? (
          <nav aria-label="Kapitel" className="mt-4 flex flex-wrap gap-1.5">
            {book.chapters.map((c, i) => {
              const done = readIds.has(c.id);
              const here = c.id === chapter.id;
              return (
                <Link
                  key={c.id}
                  href={`/buchshop/${slug}/lesen/${c.position}`}
                  title={`${c.heading}${done ? " — gelesen" : ""}`}
                  aria-current={here ? "page" : undefined}
                  className={`flex h-7 w-7 items-center justify-center rounded-md border text-xs transition-colors ${
                    done
                      ? "border-primary bg-primary text-primary-foreground"
                      : here
                        ? "border-foreground font-medium text-foreground"
                        : "border-border text-muted-foreground hover:border-foreground"
                  }`}
                >
                  {done ? "✓" : i + 1}
                </Link>
              );
            })}
          </nav>
        ) : null}

        {/* Explained once, on the first chapter. The rule was invisible before,
            which is why an honest reader read four chapters, saw a counter at 0
            and concluded the page was broken. */}
        {state && index === 0 && !state.hasReadEnough ? (
          <p className="mt-5 rounded-xl border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
            Damit deine Bewertung etwas wert ist, zählt hier nur echtes Lesen: Ein
            Kapitel gilt als gelesen, wenn du es bis zum Ende und in
            Lesegeschwindigkeit gelesen hast. Unten siehst du, wo du stehst. Ab{" "}
            {state.chaptersRequired} von {state.chaptersTotal} Kapiteln kannst du
            das Buch bewerten.
          </p>
        ) : null}

        {/* The frame: a contained page instead of loose text on a website. A web
            page invites scrolling past; something that looks like a book page
            invites reading it. */}
        <article className="mt-6 rounded-2xl border border-border bg-card px-6 py-10 shadow-sm sm:px-10">
          <h1 className="font-display text-3xl font-bold tracking-tight">
            {chapter.heading}
          </h1>
          <div className="mt-8">
            {chapter.content ? (
              <ChapterProse content={chapter.content} />
            ) : (
              <p className="text-muted-foreground">
                Dieses Kapitel hat noch keinen Text.
              </p>
            )}
          </div>
        </article>

        <nav className="mt-8 flex items-center justify-between gap-4">
          {prev ? (
            <Button asChild variant="outline">
              <Link href={`/buchshop/${slug}/lesen/${prev.position}`}>
                ← Vorheriges Kapitel
              </Link>
            </Button>
          ) : (
            <span />
          )}
          {next ? (
            <Button asChild>
              <Link href={`/buchshop/${slug}/lesen/${next.position}`}>
                Nächstes Kapitel →
              </Link>
            </Button>
          ) : (
            <Button asChild>
              <Link href={`/buchshop/${slug}#bewerten`}>Buch bewerten</Link>
            </Button>
          )}
        </nav>

        {state?.hasReadEnough ? (
          <p className="mt-6 text-sm text-muted-foreground">
            Du hast genug gelesen, um dieses Buch zu bewerten.{" "}
            <Link
              href={`/buchshop/${slug}#bewerten`}
              className="underline underline-offset-2"
            >
              Jetzt bewerten
            </Link>
          </p>
        ) : null}
      </main>

      {/* Own reading is not tracked: nothing to prove, nothing to review. */}
      {progress ? (
        <ReadingBar
          key={chapter.id}
          chapterId={chapter.id}
          secondsActive={progress.secondsActive}
          secondsNeeded={progress.secondsNeeded}
          reachedEnd={progress.reachedEnd}
          counted={progress.counted}
        />
      ) : null}
    </>
  );
}
