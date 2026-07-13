import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isProjectUnlocked } from "@/lib/billing/access";
import { Button } from "@/components/ui/button";
import { ChapterEditor } from "@/components/buchwerk/chapter-editor";
import { GenerationPoller } from "@/components/buchwerk/generation-poller";
import { WorkflowStepper } from "@/components/buchwerk/workflow-stepper";
import { Spinner } from "@/components/buchwerk/spinner";
import { STALE_GENERATION_MS, MIN_TOTAL_WORDS } from "@/lib/books/generate";
import { computeChapterView } from "@/lib/books/project-view";
import { OUTLINE_RUNNING_STATUS } from "@/lib/books/outline-generate";
import { EditableTitle } from "@/components/buchwerk/editable-title";
import { OutlineActions } from "@/components/buchwerk/outline-actions";

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

  const [{ data: chapters }, unlocked] = await Promise.all([
    supabase
      .from("chapters")
      .select("id, position, heading, summary, content, status, updated_at")
      .eq("project_id", id)
      .order("position"),
    isProjectUnlocked(supabase, id),
  ]);

  // Server Component: the per-request wall clock is exactly what we want here —
  // the poller re-renders this page every few seconds, so staleness is
  // re-evaluated on each refresh.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const {
    views: list,
    done,
    hasWrittenChapters,
    finished,
    progressPct,
    totalWords,
    belowMinimum,
    anyGenerating,
  } = computeChapterView(chapters, now);

  // A fresh "gliederung_läuft" status means a new outline is being generated.
  // Once it's stale we fall back to the normal buttons so it can be retried.
  const outlineAgeMs = now - new Date(project.updated_at).getTime();
  const outlineGenerating =
    project.status === OUTLINE_RUNNING_STATUS &&
    outlineAgeMs < STALE_GENERATION_MS;

  const pollerActive = anyGenerating || outlineGenerating;

  // Guided workflow: Schreiben → Cover → Listing → Veröffentlichen. (Recherche
  // läuft automatisch in der Kapitel-Pipeline, ist kein eigener Nutzerschritt.)
  // The first not-done required step becomes "current"; the optional final step
  // (Veröffentlichen) can't be auto-detected as done.
  const workflowRaw = [
    {
      label: "Schreiben",
      href: `/projekte/${project.id}/schreiben`,
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
      label: "Listing",
      href: `/projekte/${project.id}/kdp`,
      cta: "Listing erstellen",
      done: Boolean(listingRow),
      optional: false,
    },
    {
      label: "Veröffentlichen",
      href: `/projekte/${project.id}/veroeffentlichen`,
      cta: "Zum Veröffentlichen",
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
  // The one prominent next action shown at the top of the cockpit.
  const currentStep = workflowSteps.find((s) => s.status === "current") ?? null;

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
          {currentStep ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                  Nächster Schritt
                </p>
                <p className="mt-0.5 font-display text-lg font-semibold tracking-tight">
                  {currentStep.label}
                </p>
              </div>
              <Button asChild size="lg">
                <Link href={currentStep.href}>{currentStep.cta}</Link>
              </Button>
            </div>
          ) : null}
          <WorkflowStepper steps={workflowSteps} />
        </div>
      )}

      {/* Gliederung — Reihenfolge/Überschriften/Kurzbeschreibungen anpassen.
          Kostenlos (auch ohne Freischaltung); geschrieben wird im Schritt
          „Schreiben" (eigene Seite). */}
      <div id="kapitel" className="mt-10 scroll-mt-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold tracking-tight">
            Gliederung
          </h2>
          {unlocked ? (
            <Button asChild size="sm">
              <Link href={`/projekte/${project.id}/schreiben`}>
                {hasWrittenChapters ? "Weiter schreiben" : "Kapitel schreiben"}
              </Link>
            </Button>
          ) : null}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Passe Reihenfolge, Überschriften und Kurzbeschreibungen an — kostenlos.
          Geschrieben wird im Schritt „Schreiben“.
        </p>
        {!unlocked ? (
          <p className="mt-3 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
            Kapitel generieren kannst du, sobald du das Buch freigeschaltet
            hast —{" "}
            <Link
              href={`/projekte/${project.id}/freischalten`}
              className="font-medium text-primary underline underline-offset-2"
            >
              jetzt freischalten
            </Link>{" "}
            (einmalig 19,99 € oder im Abo).
          </p>
        ) : null}
        <div className="mt-5 space-y-4">
          {list.map((chapter, index) => (
            <article
              key={chapter.id}
              className="rounded-2xl border border-border bg-card p-5"
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
                isGenerating={chapter.isGenerating}
                isStale={chapter.isStale}
              />
            </article>
          ))}
        </div>
      </div>

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
