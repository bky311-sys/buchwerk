import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isProjectUnlocked, isSubscriber } from "@/lib/billing/access";
import { Button } from "@/components/ui/button";
import { ChapterGenerator } from "@/components/buchwerk/chapter-generator";
import { ChapterEditor } from "@/components/buchwerk/chapter-editor";
import { ChapterContent } from "@/components/buchwerk/chapter-content";
import { EditableTitle } from "@/components/buchwerk/editable-title";
import { OutlineActions } from "@/components/buchwerk/outline-actions";
import { ShopPublish } from "@/components/buchwerk/shop-publish";
import { ReviewModeration } from "@/components/buchwerk/review-moderation";
import { getPendingReviewsForAuthor } from "@/lib/shop/reviews";
import { getPointsBalance } from "@/lib/shop/points";

export const metadata: Metadata = {
  title: "Projekt — Buchwerk",
};

export const maxDuration = 60;

export default async function ProjektPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("id, title, topic, audience, status")
    .eq("id", id)
    .single();
  if (!project) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Shop columns are queried separately and best-effort: if the Buchshop
  // migration hasn't been applied yet, this errors and the section stays hidden
  // instead of breaking the whole project page.
  const { data: shopRow } = await supabase
    .from("projects")
    .select("shop_published, shop_slug, amazon_url")
    .eq("id", id)
    .maybeSingle();

  // Pending reviews the author can moderate (only for a published book; empty
  // and harmless if the reviews migration isn't applied yet).
  const pendingReviews = shopRow?.shop_published
    ? await getPendingReviewsForAuthor(id)
    : [];

  // Points balance + boost state for the publish section (best-effort: 0 / null
  // if the reviews/boost migrations aren't applied yet).
  const pointsBalance =
    shopRow?.shop_published && user
      ? await getPointsBalance(supabase, user.id)
      : 0;
  const { data: boostRow } = shopRow?.shop_published
    ? await supabase
        .from("projects")
        .select("boosted_until")
        .eq("id", id)
        .maybeSingle()
    : { data: null };
  const boostedUntil = boostRow?.boosted_until ?? null;

  const [{ data: chapters }, unlocked, subscriber] = await Promise.all([
    supabase
      .from("chapters")
      .select("id, position, heading, summary, content, status")
      .eq("project_id", id)
      .order("position"),
    isProjectUnlocked(supabase, id),
    user ? isSubscriber(supabase, user.id) : Promise.resolve(false),
  ]);

  const list = chapters ?? [];
  const done = list.filter((c) => c.status === "fertig").length;
  const hasWrittenChapters = list.some((c) => Boolean(c.content));
  const progressPct = list.length ? Math.round((done / list.length) * 100) : 0;

  // Buchshop: a finished book can be published by a subscriber.
  const finished = list.length > 0 && list.every((c) => Boolean(c.content));
  const canPublish = finished && subscriber;
  const blockReason = !finished
    ? ("not_finished" as const)
    : !subscriber
      ? ("not_subscriber" as const)
      : null;

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Link
        href="/projekte"
        className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
      >
        ← Alle Projekte
      </Link>

      <div className="mt-6">
        <EditableTitle
          projectId={project.id}
          title={project.title ?? project.topic}
        />
      </div>
      <p className="mt-3 text-base text-muted-foreground">{project.topic}</p>

      <div className="mt-5 flex items-center gap-4">
        <div className="h-2 w-full max-w-[220px] overflow-hidden rounded-full bg-input">
          <div
            className="h-full rounded-full bg-primary transition-[width]"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <span className="text-sm font-semibold text-primary tabular-nums">
          {done} / {list.length} Kapitel
        </span>
      </div>

      {!unlocked ? (
        <div className="mt-6 rounded-2xl border border-border bg-card p-6">
          <p className="text-sm font-semibold">
            Dieses Buch ist noch nicht freigeschaltet.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Gliederung anpassen ist kostenlos. Zum Kapitel-Schreiben, Cover,
            KDP-Listing und PDF schalte das Buch frei (einmalig 19,99 € oder im
            Abo).
          </p>
          <div className="mt-4">
            <Button asChild size="lg">
              <Link href={`/projekte/${project.id}/freischalten`}>
                Buch freischalten
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-6 flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href={`/projekte/${project.id}/kdp`}>KDP-Listing</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/projekte/${project.id}/cover`}>Cover</Link>
          </Button>
        </div>
      )}

      <div className="mt-10 space-y-5">
        {list.map((chapter, index) => (
          <article
            key={chapter.id}
            className="rounded-2xl border border-border bg-card p-6 sm:p-7"
          >
            <ChapterEditor
              chapterId={chapter.id}
              number={index + 1}
              heading={chapter.heading}
              summary={chapter.summary ?? ""}
              status={chapter.status}
              isFirst={index === 0}
              isLast={index === list.length - 1}
              hasContent={Boolean(chapter.content)}
            />

            {chapter.content ? (
              <ChapterContent chapterId={chapter.id} content={chapter.content} />
            ) : (
              <p className="mt-5 text-sm text-muted-foreground">
                Dieses Kapitel ist noch nicht geschrieben.
              </p>
            )}

            {unlocked ? (
              <div className="mt-5">
                <ChapterGenerator
                  chapterId={chapter.id}
                  hasContent={Boolean(chapter.content)}
                />
              </div>
            ) : null}
          </article>
        ))}
      </div>

      {unlocked && shopRow ? (
        <div className="mt-6">
          <ShopPublish
            projectId={project.id}
            isPublished={shopRow.shop_published}
            shopSlug={shopRow.shop_slug}
            amazonUrl={shopRow.amazon_url}
            canPublish={canPublish}
            blockReason={blockReason}
            pointsBalance={pointsBalance}
            boostedUntil={boostedUntil}
          />
        </div>
      ) : null}

      {pendingReviews.length > 0 ? (
        <div className="mt-4">
          <ReviewModeration reviews={pendingReviews} />
        </div>
      ) : null}

      <div className="mt-12 border-t border-border pt-6">
        <OutlineActions
          projectId={project.id}
          hasWrittenChapters={hasWrittenChapters}
        />
      </div>
    </div>
  );
}
