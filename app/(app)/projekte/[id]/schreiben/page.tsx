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
import { StatusBadge } from "@/components/buchwerk/status-badge";
import { Spinner } from "@/components/buchwerk/spinner";
import { MIN_TOTAL_WORDS } from "@/lib/books/generate";
import { RESEARCH_TOTAL_STAGES } from "@/lib/books/research";
import { computeChapterView } from "@/lib/books/project-view";

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

  const [{ data: chapters }, unlocked, { data: researchRow }] =
    await Promise.all([
      supabase
        .from("chapters")
        .select("id, position, heading, summary, content, status, updated_at")
        .eq("project_id", id)
        .order("position"),
      canAccessProject(supabase, id),
      supabase
        .from("projects")
        .select("research")
        .eq("id", id)
        .maybeSingle(),
    ]);

  const hasResearch = Boolean(researchRow?.research?.trim());

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
  } = computeChapterView(chapters, now);

  const title = project.title ?? project.topic;

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
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
        <>
          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="h-2 w-full max-w-[220px] overflow-hidden rounded-full bg-input">
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

          <GenerationPoller active={anyGenerating} />

          {unwrittenIds.length > 1 ? (
            <div className="mt-8">
              <BatchWrite
                projectId={project.id}
                chapterIds={unwrittenIds}
                needsResearch={!hasResearch}
                researchStages={RESEARCH_TOTAL_STAGES}
              />
            </div>
          ) : null}

          <div className="mt-8 space-y-4">
            {views.map((chapter, index) => {
              const badge = chapter.isGenerating ? (
                <StatusBadge intent="draft">
                  <Spinner className="size-3" />
                  Wird geschrieben…
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
                    />
                  </div>
                </ChapterCollapse>
              );
            })}
          </div>

          <div className="mt-10 border-t border-border pt-6">
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
                <Link href={`/projekte/${project.id}`}>← Zurück zum Projekt</Link>
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
