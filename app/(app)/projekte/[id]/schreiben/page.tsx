import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { canAccessProject } from "@/lib/billing/access";
import { Button } from "@/components/ui/button";
import { ChapterContent } from "@/components/buchwerk/chapter-content";
import { ChapterGenerator } from "@/components/buchwerk/chapter-generator";
import { GenerationPoller } from "@/components/buchwerk/generation-poller";
import { BatchWrite } from "@/components/buchwerk/batch-write";
import { ChapterCollapse } from "@/components/buchwerk/chapter-collapse";
import { ChapterAccordion } from "@/components/buchwerk/chapter-accordion";
import { ChapterNavigator } from "@/components/buchwerk/chapter-navigator";
import { StatusBadge } from "@/components/buchwerk/status-badge";
import { Spinner } from "@/components/buchwerk/spinner";
import { LENGTH_TIERS, coerceLengthTier } from "@/lib/books/length";
import { RESEARCH_TOTAL_STAGES } from "@/lib/books/research";
import { computeChapterView } from "@/lib/books/project-view";
import { getWorkflowSteps } from "@/lib/books/workflow";
import { WorkflowStepper } from "@/components/buchwerk/workflow-stepper";

export const metadata: Metadata = {
  title: "Schreiben — Buchwerk",
};

export const maxDuration = 60;

export default async function SchreibenPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("id, title, topic")
    .eq("id", id)
    .single();
  if (!project) notFound();

  const [{ data: chapters }, unlocked, { data: researchRow }, { data: tierRow }] =
    await Promise.all([
      supabase
        .from("chapters")
        .select(
          "id, position, heading, summary, content, status, updated_at, generation_step",
        )
        .eq("project_id", id)
        .order("position"),
      canAccessProject(supabase, id),
      supabase
        .from("projects")
        .select("research")
        .eq("id", id)
        .maybeSingle(),
      supabase.from("projects").select("length_tier").eq("id", id).maybeSingle(),
    ]);
  const lengthTier = LENGTH_TIERS[coerceLengthTier(tierRow?.length_tier)];

  const hasResearch = Boolean(researchRow?.research?.trim());
  const workflowSteps = await getWorkflowSteps(supabase, id);

  // Server Component: the per-request wall clock is exactly what we want — the
  // poller re-renders this page every few seconds, so staleness is re-evaluated.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const {
    views,
    done,
    hasWrittenChapters,
    finished,
    progressPct,
    totalWords,
    belowMinimum,
    anyGenerating,
    unwrittenIds,
    firstUnwrittenId,
  } = computeChapterView(chapters, now, lengthTier.minWords);

  const title = project.title ?? project.topic;

  // Cockpit-Ableitungen: das laufende Kapitel (für Status-Leiste + Auto-Folge
  // des Akkordeons) und der Navigator-Zustand je Kapitel.
  const generating = views.find((c) => c.isGenerating) ?? null;
  const generatingLabel = generating
    ? `Kapitel ${generating.position} wird geschrieben${
        generating.generation_step ? ` — ${generating.generation_step}` : ""
      }…`
    : null;
  const anchorOf = (chapterId: string) => `kap-${chapterId}`;
  const navigatorItems = views.map((c, index) => ({
    anchorId: anchorOf(c.id),
    number: index + 1,
    heading: c.heading,
    state: c.isGenerating
      ? ("generating" as const)
      : c.isStale && !c.content
        ? ("error" as const)
        : c.status === "fertig" && c.content
          ? ("done" as const)
          : c.content
            ? ("draft" as const)
            : ("open" as const),
  }));
  const initialOpenId = generating
    ? anchorOf(generating.id)
    : firstUnwrittenId
      ? anchorOf(firstUnwrittenId)
      : null;
  const followId = generating ? anchorOf(generating.id) : null;

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <Link
        href={`/projekte/${project.id}`}
        className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
      >
        ← Zum Projekt
      </Link>

      <h1 className="mt-6 font-display text-2xl font-bold tracking-tight sm:text-3xl">
        Schreiben
      </h1>
      <p className="mt-2 text-base text-muted-foreground">{title}</p>

      {/* Orientierung: derselbe Stepper wie im Hub, „Schreiben" markiert. */}
      <div className="mt-5">
        <WorkflowStepper steps={workflowSteps} activeLabel="Schreiben" compact />
      </div>

      {!unlocked ? (
        <div className="mt-8 rounded-2xl border border-border bg-card p-6">
          <p className="text-sm font-semibold">
            Zum Schreiben ist dieses Buch noch nicht freigeschaltet.
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
        <ChapterAccordion initialOpenId={initialOpenId} followId={followId}>
          {/* Sticky Status-Leiste: Fortschritt, Wortzahl, Live-Vorgang und der
              eine kontextabhängige Primär-Button — bleibt beim Scrollen oben. */}
          <div className="sticky top-0 z-20 -mx-6 mt-6 border-b border-border bg-background/95 px-6 py-3 backdrop-blur">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <div className="h-2 w-full max-w-[180px] overflow-hidden rounded-full bg-input">
                <div
                  className="h-full rounded-full bg-primary transition-[width]"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-primary tabular-nums">
                {done} / {views.length} Kapitel
              </span>
              {hasWrittenChapters ? (
                <span
                  className={`text-sm font-medium tabular-nums ${
                    belowMinimum ? "text-clay-strong" : "text-muted-foreground"
                  }`}
                  title={`Mindestlänge ${lengthTier.minWords.toLocaleString("de-DE")} Wörter (${lengthTier.label}, ${lengthTier.seiten})`}
                >
                  ≈ {totalWords.toLocaleString("de-DE")} Wörter
                  {belowMinimum ? " (unter Minimum)" : ""}
                </span>
              ) : null}
              {generatingLabel ? (
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-clay-strong">
                  <Spinner className="size-4" />
                  {generatingLabel}
                </span>
              ) : null}
              <div className="ml-auto">
                {finished ? (
                  <Button asChild>
                    <Link href={`/projekte/${project.id}/cover`}>
                      Weiter zum Cover
                    </Link>
                  </Button>
                ) : unwrittenIds.length > 0 ? (
                  <BatchWrite
                    projectId={project.id}
                    chapterIds={unwrittenIds}
                    needsResearch={!hasResearch}
                    researchStages={RESEARCH_TOTAL_STAGES}
                    otherGenerating={anyGenerating}
                  />
                ) : null}
              </div>
            </div>
            {/* Mobil: Kapitel-Chips direkt unter der Leiste */}
            <div className="mt-3 lg:hidden">
              <ChapterNavigator items={navigatorItems} />
            </div>
          </div>

          <GenerationPoller active={anyGenerating} />

          <div className="mt-8 lg:grid lg:grid-cols-[240px_1fr] lg:gap-8">
            {/* Desktop: Kapitel-Navigator als Seitenleiste */}
            <aside className="hidden lg:block">
              <div className="sticky top-20">
                <p className="px-2.5 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Kapitel
                </p>
                <ChapterNavigator items={navigatorItems} />
              </div>
            </aside>

            <div className="space-y-3">
            {views.map((chapter, index) => {
              const badge = chapter.isGenerating ? (
                <StatusBadge intent="draft">
                  <Spinner className="size-3" />
                  {chapter.generation_step
                    ? `Wird geschrieben — ${chapter.generation_step}…`
                    : "Wird geschrieben…"}
                </StatusBadge>
              ) : chapter.isStale && !chapter.content ? (
                <StatusBadge intent="error">Fehlgeschlagen</StatusBadge>
              ) : chapter.status === "fertig" && chapter.content ? (
                <StatusBadge intent="done">✓ Fertig</StatusBadge>
              ) : chapter.content ? (
                <StatusBadge intent="draft">Entwurf</StatusBadge>
              ) : (
                <StatusBadge intent="neutral">Offen</StatusBadge>
              );
              // Chapters that still need attention start open; finished ones start
              // collapsed so the page stays short.
              const defaultOpen =
                !chapter.content || chapter.isGenerating || chapter.isStale;
              return (
                <ChapterCollapse
                  key={chapter.id}
                  number={index + 1}
                  heading={chapter.heading}
                  badge={badge}
                  defaultOpen={defaultOpen}
                  anchorId={`kap-${chapter.id}`}
                >
                  {chapter.content ? (
                    <ChapterContent
                      chapterId={chapter.id}
                      content={chapter.content}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Dieses Kapitel ist noch nicht geschrieben.
                    </p>
                  )}

                  <div className="mt-5">
                    <ChapterGenerator
                      chapterId={chapter.id}
                      projectId={project.id}
                      hasContent={Boolean(chapter.content)}
                      isGenerating={chapter.isGenerating}
                      isStale={chapter.isStale}
                      willResearch={
                        !hasResearch && chapter.id === firstUnwrittenId
                      }
                      researchStages={RESEARCH_TOTAL_STAGES}
                      otherGenerating={anyGenerating && !chapter.isGenerating}
                    />
                  </div>
                </ChapterCollapse>
              );
            })}

              <div className="mt-8 border-t border-border pt-6">
                {finished ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-sm font-medium text-success">
                      ✓ Alle Kapitel geschrieben.
                    </p>
                    <Button asChild size="lg">
                      <Link href={`/projekte/${project.id}/cover`}>
                        Weiter zum Cover
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <Button asChild variant="outline">
                    <Link href={`/projekte/${project.id}`}>
                      ← Zurück zum Projekt
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </ChapterAccordion>
      )}
    </div>
  );
}
