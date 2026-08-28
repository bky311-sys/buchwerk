import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { canAccessProject } from "@/lib/billing/access";
import { Button } from "@/components/ui/button";
import { QualityReportPanel } from "@/components/buchwerk/quality-report-panel";
import { WorkflowStepper } from "@/components/buchwerk/workflow-stepper";
import { getWorkflowSteps } from "@/lib/books/workflow";
import {
  coerceQualityReport,
  QUALITY_STALE_MS,
} from "@/lib/books/quality-report";
import { REVISION_STALE_MS } from "@/lib/books/revise";

export const metadata: Metadata = { title: "Qualitätscheck — Buchwerk" };

// Eigener Workflow-Schritt zwischen Schreiben und Cover (Benjamins Auftrag
// 26.08.): Der Bericht kam bisher zuletzt auf /veroeffentlichen — wenn er dort
// Faktenfehler oder Wiederholungen meldet, sind Cover und Klappentext längst
// gebaut. Erst der Text final, dann die Verpackung.
export default async function QualityPage({
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

  if (!(await canAccessProject(supabase, id))) {
    redirect(`/projekte/${id}/freischalten`);
  }

  const workflowSteps = await getWorkflowSteps(supabase, id);

  // Best-effort in eigener Abfrage (Regel Entscheidungslog 2026-07-15).
  const { data: qualityRow } = await supabase
    .from("projects")
    .select("quality_report, quality_status, quality_updated_at")
    .eq("id", id)
    .maybeSingle();
  const report = coerceQualityReport(qualityRow?.quality_report ?? null);
  // Server Component: per-request wall clock ist gewollt — der Poller
  // rendert die Seite neu, Staleness wird dabei neu bewertet.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const ageMs = qualityRow?.quality_updated_at
    ? now - new Date(qualityRow.quality_updated_at).getTime()
    : Number.POSITIVE_INFINITY;
  const isRunning =
    qualityRow?.quality_status === "läuft" && ageMs < QUALITY_STALE_MS;
  const hasFailed =
    qualityRow?.quality_status === "fehler" ||
    (qualityRow?.quality_status === "läuft" && !isRunning);

  // Überarbeitungs-Status (best-effort, eigene Abfrage).
  const { data: revisionRow } = await supabase
    .from("projects")
    .select("revision_status, revision_updated_at, revision_note")
    .eq("id", id)
    .maybeSingle();
  const revisionAgeMs = revisionRow?.revision_updated_at
    ? now - new Date(revisionRow.revision_updated_at).getTime()
    : Number.POSITIVE_INFINITY;
  const revisionRunning =
    revisionRow?.revision_status === "läuft" &&
    revisionAgeMs < REVISION_STALE_MS;

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
        Qualitätscheck
      </h1>
      <p className="mt-2 text-base text-muted-foreground">{title}</p>

      <div className="mt-5">
        <WorkflowStepper
          steps={workflowSteps}
          activeLabel="Qualitätscheck"
          compact
        />
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        Ein strenger Lektorats-Durchgang über das ganze Buch: Wiederholungen
        zwischen Kapiteln, Widersprüche, Faktenlage, KI-Floskeln, Stil und
        Rechtschreibung — plus ein Link-Check aller Quellen. Danach kannst du
        die Befunde automatisch beheben lassen. Erst wenn der Text sitzt, geht
        es an Cover und Listing.
      </p>

      <div className="mt-6">
        <QualityReportPanel
          projectId={project.id}
          report={report}
          isRunning={isRunning}
          hasFailed={hasFailed}
          revisionRunning={revisionRunning}
          revisionNote={revisionRow?.revision_note ?? null}
        />
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-border pt-6">
        <Button asChild>
          <Link href={`/projekte/${project.id}/cover`}>Weiter zum Cover</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`/projekte/${project.id}/schreiben`}>
            ← Zurück zum Schreiben
          </Link>
        </Button>
      </div>
    </div>
  );
}
