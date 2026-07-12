import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isProjectUnlocked, isSubscriber } from "@/lib/billing/access";
import { Button } from "@/components/ui/button";
import { ChapterGenerator } from "@/components/buchwerk/chapter-generator";
import { ChapterEditor } from "@/components/buchwerk/chapter-editor";
import { ChapterContent } from "@/components/buchwerk/chapter-content";
import { GenerationPoller } from "@/components/buchwerk/generation-poller";
import { WorkflowStepper } from "@/components/buchwerk/workflow-stepper";
import { PublishGuide } from "@/components/buchwerk/publish-guide";
import { BatchWrite } from "@/components/buchwerk/batch-write";
import { Spinner } from "@/components/buchwerk/spinner";
import {
  STALE_GENERATION_MS,
  MIN_TOTAL_WORDS,
  countWords,
} from "@/lib/books/generate";
import { OUTLINE_RUNNING_STATUS } from "@/lib/books/outline-generate";
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
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ freigeschaltet?: string }>;
}) {
  const { id } = await params;
  const { freigeschaltet } = await searchParams;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("id, title, topic, audience, status, updated_at")
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

  // Cover + KDP-listing existence drive the guided workflow stepper (best-effort).
  const { data: selectedCover } = await supabase
    .from("covers")
    .select("id")
    .eq("project_id", id)
    .eq("is_selected", true)
    .maybeSingle();
  const { data: listingRow } = await supabase
    .from("kdp_listings")
    .select("project_id")
    .eq("project_id", id)
    .maybeSingle();
  // Whether a research dossier already exists (best-effort) — drives the honest
  // spinner text and lets the batch write research once up front.
  const { data: researchRow } = await supabase
    .from("projects")
    .select("research")
    .eq("id", id)
    .maybeSingle();
  const hasResearch = Boolean(researchRow?.research?.trim());

  const [{ data: chapters }, unlocked, subscriber] = await Promise.all([
    supabase
      .from("chapters")
      .select("id, position, heading, summary, content, status, updated_at")
      .eq("project_id", id)
      .order("position"),
    isProjectUnlocked(supabase, id),
    user ? isSubscriber(supabase, user.id) : Promise.resolve(false),
  ]);

  const list = chapters ?? [];
  const done = list.filter((c) => c.status === "fertig").length;
  const hasWrittenChapters = list.some((c) => Boolean(c.content));
  const progressPct = list.length ? Math.round((done / list.length) * 100) : 0;

  // Chapters that still need writing (in order). The first of these is where the
  // "Buch schreiben" step and the auto-research kick in.
  const unwrittenIds = list.filter((c) => !c.content).map((c) => c.id);
  const firstUnwrittenId = unwrittenIds[0] ?? null;

  // Live generation state per chapter. A chapter is "generating" while its
  // status is "schreiben" and the write is recent; once it's older than the
  // stale threshold the function was almost certainly killed, so we treat it as
  // failed and offer a retry.
  // Server Component: the per-request wall clock is exactly what we want here —
  // the poller re-renders this page every few seconds, so staleness is
  // re-evaluated on each refresh.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const genState = new Map(
    list.map((c) => {
      const writing = c.status === "schreiben";
      const ageMs = now - new Date(c.updated_at).getTime();
      const isGenerating = writing && ageMs < STALE_GENERATION_MS;
      const isStale = (writing && ageMs >= STALE_GENERATION_MS) ||
        c.status === "fehler";
      return [c.id, { isGenerating, isStale }] as const;
    }),
  );
  const anyGenerating = list.some((c) => genState.get(c.id)?.isGenerating);

  // A fresh "gliederung_läuft" status means a new outline is being generated.
  // Once it's stale we fall back to the normal buttons so it can be retried.
  const outlineAgeMs = now - new Date(project.updated_at).getTime();
  const outlineGenerating =
    project.status === OUTLINE_RUNNING_STATUS &&
    outlineAgeMs < STALE_GENERATION_MS;

  // Total word count across written chapters — the book must clear 7000.
  const totalWords = list.reduce(
    (sum, c) => sum + (c.content ? countWords(c.content) : 0),
    0,
  );
  const belowMinimum = hasWrittenChapters && totalWords < MIN_TOTAL_WORDS;

  const pollerActive = anyGenerating || outlineGenerating;

  // Buchshop: a finished book can be published by a subscriber.
  const finished = list.length > 0 && list.every((c) => Boolean(c.content));
  const canPublish = finished && subscriber;
  const blockReason = !finished
    ? ("not_finished" as const)
    : !subscriber
      ? ("not_subscriber" as const)
      : null;

  // Guided workflow: Buch schreiben → Cover → KDP-Listing → Live. (Recherche
  // läuft automatisch in der Kapitel-Pipeline, ist kein eigener Nutzerschritt.)
  // The first not-done required step becomes "current"; an optional step
  // (Veröffentlichen) that was skipped shows as optional.
  const workflowRaw = [
    {
      label: "Buch schreiben",
      href: firstUnwrittenId ? `#ch-${firstUnwrittenId}` : "#kapitel",
      cta: hasWrittenChapters ? "Weiter schreiben" : "Kapitel schreiben",
      done: finished,
      optional: false,
    },
    {
      label: "Cover",
      href: `/projekte/${project.id}/cover`,
      cta: "Cover erstellen",
      done: Boolean(selectedCover),
      optional: false,
    },
    {
      label: "KDP-Listing",
      href: `/projekte/${project.id}/kdp`,
      cta: "KDP-Listing erstellen",
      done: Boolean(listingRow),
      optional: false,
    },
    {
      label: "Bei Amazon veröffentlichen",
      href: "#veroeffentlichen",
      cta: "Zur Anleitung",
      // External, manual step — we can't detect completion, so it stays the
      // final call-to-action rather than auto-completing.
      done: false,
      optional: true,
    },
  ];
  let currentTaken = false;
  const workflowSteps = workflowRaw.map((step, index) => {
    let status: "done" | "current" | "todo" | "optional";
    if (step.done) {
      status = "done";
    } else if (
      step.optional &&
      workflowRaw.slice(index + 1).some((later) => later.done)
    ) {
      status = "optional";
    } else if (!currentTaken) {
      status = "current";
      currentTaken = true;
    } else {
      status = "todo";
    }
    return { label: step.label, href: step.href, cta: step.cta, status };
  });

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

      {freigeschaltet === "1" && unlocked ? (
        <div className="mt-5 rounded-2xl border border-success/30 bg-success-tint p-4">
          <p className="text-sm font-semibold text-success">
            ✓ Buch freigeschaltet — danke!
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Du kannst jetzt Kapitel schreiben, Cover und KDP-Listing erstellen
            und dein Manuskript herunterladen. Der nächste Schritt steht unten im
            Ablauf.
          </p>
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="h-2 w-full max-w-[220px] overflow-hidden rounded-full bg-input">
          <div
            className="h-full rounded-full bg-primary transition-[width]"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <span className="text-sm font-semibold text-primary tabular-nums">
          {done} / {list.length} Kapitel
        </span>
        {hasWrittenChapters ? (
          <span
            className={`text-sm font-medium tabular-nums ${
              belowMinimum ? "text-clay-strong" : "text-muted-foreground"
            }`}
            title={`Mindestlänge ${MIN_TOTAL_WORDS.toLocaleString("de-DE")} Wörter`}
          >
            ≈ {totalWords.toLocaleString("de-DE")} Wörter
            {belowMinimum ? " (unter Minimum)" : ""}
          </span>
        ) : null}
        {anyGenerating ? (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-clay-strong">
            <Spinner className="size-4" />
            Kapitel wird geschrieben…
          </span>
        ) : null}
      </div>

      {/* Auto-refreshes the page while a chapter or the outline is generating. */}
      <GenerationPoller active={pollerActive} />

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
        <div className="mt-6 space-y-4">
          <WorkflowStepper steps={workflowSteps} />
          {finished ? (
            <Button asChild variant="ink" size="lg">
              <a href={`/projekte/${project.id}/manuskript/pdf`} download>
                Manuskript-PDF herunterladen
              </a>
            </Button>
          ) : null}
        </div>
      )}

      {unlocked && unwrittenIds.length > 1 ? (
        <div className="mt-10">
          <BatchWrite
            projectId={project.id}
            chapterIds={unwrittenIds}
            needsResearch={!hasResearch}
          />
        </div>
      ) : null}

      <div id="kapitel" className="mt-10 space-y-5 scroll-mt-6">
        {list.map((chapter, index) => {
          const gen = genState.get(chapter.id) ?? {
            isGenerating: false,
            isStale: false,
          };
          return (
          <article
            key={chapter.id}
            id={`ch-${chapter.id}`}
            className="scroll-mt-6 rounded-2xl border border-border bg-card p-6 sm:p-7"
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
              isGenerating={gen.isGenerating}
              isStale={gen.isStale}
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
                  isGenerating={gen.isGenerating}
                  isStale={gen.isStale}
                  willResearch={!hasResearch && chapter.id === firstUnwrittenId}
                />
              </div>
            ) : null}
          </article>
          );
        })}
      </div>

      {unlocked ? (
        <div className="mt-10">
          <p className="mb-3 text-sm font-semibold text-muted-foreground">
            Wie geht&apos;s weiter?
          </p>
          <WorkflowStepper steps={workflowSteps} />
        </div>
      ) : null}

      {unlocked ? (
        <div id="veroeffentlichen" className="mt-6 scroll-mt-6">
          <PublishGuide projectId={project.id} finished={finished} />
        </div>
      ) : null}

      {unlocked && shopRow ? (
        <div className="mt-4">
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
          isRegenerating={outlineGenerating}
        />
      </div>
    </div>
  );
}
