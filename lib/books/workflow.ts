import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { WorkflowStep } from "@/components/buchwerk/workflow-stepper";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

// Der geführte Ablauf: Schreiben → Cover → Listing → Veröffentlichen.
// Ein Ort für die Schritt-Logik, damit Hub, Spoke-Seiten und Projektkarten
// nie auseinanderlaufen (vorher lebte sie nur im Hub).

export type WorkflowFlags = {
  projectId: string;
  finished: boolean;
  hasWrittenChapters: boolean;
  hasCover: boolean;
  hasListing: boolean;
  hasQualityReport: boolean;
  published: boolean;
};

export function buildWorkflowSteps(flags: WorkflowFlags): WorkflowStep[] {
  const raw = [
    {
      label: "Schreiben",
      href: `/projekte/${flags.projectId}/schreiben`,
      cta: flags.hasWrittenChapters ? "Weiter schreiben" : "Kapitel schreiben",
      done: flags.finished,
      optional: false,
    },
    {
      label: "Cover",
      href: `/projekte/${flags.projectId}/cover`,
      cta: "Cover erstellen",
      done: flags.hasCover,
      optional: false,
    },
    {
      label: "Listing",
      href: `/projekte/${flags.projectId}/kdp`,
      cta: "Listing erstellen",
      done: flags.hasListing,
      optional: false,
    },
    {
      // Sichtbarer eigener Schritt (Review-Maßnahme 12.08.): der QS-Lauf
      // existierte, war aber auf der Veröffentlichen-Seite versteckt — als
      // Verkaufsargument („Qualitätscheck vor jedem Export") muss er im
      // Ablauf auftauchen. Das Panel lebt weiterhin auf /veroeffentlichen.
      label: "Qualitätscheck",
      href: `/projekte/${flags.projectId}/veroeffentlichen`,
      cta: flags.hasQualityReport ? "Bericht ansehen" : "Qualitätscheck starten",
      done: flags.hasQualityReport,
      optional: true,
    },
    {
      label: "Veröffentlichen",
      href: `/projekte/${flags.projectId}/veroeffentlichen`,
      cta: flags.published ? "Ansehen" : "Zum Veröffentlichen",
      // Manueller Meilenstein: der Autor markiert das Buch als veröffentlicht.
      done: flags.published,
      optional: true,
    },
  ];
  let currentTaken = false;
  return raw.map((step, index) => {
    let status: WorkflowStep["status"];
    if (step.done) {
      status = "done";
    } else if (
      step.optional &&
      raw.slice(index + 1).some((later) => later.done)
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
}

// Lädt die Flags für EIN Projekt (für die Spoke-Seiten). Bewusst getrennte
// Abfragen — nie eine "vielleicht fehlende" Spalte in einen Sammel-SELECT
// (siehe Entscheidungslog 2026-07-15).
export async function getWorkflowSteps(
  supabase: SupabaseClient,
  projectId: string,
): Promise<WorkflowStep[]> {
  const [
    { data: chapters },
    { data: cover },
    { data: listing },
    { data: proj },
    { data: quality },
  ] = await Promise.all([
    supabase
      .from("chapters")
      .select("content, status")
      .eq("project_id", projectId),
    supabase
      .from("covers")
      .select("id")
      .eq("project_id", projectId)
      .eq("is_selected", true)
      .maybeSingle(),
    // title statt Existenz: der Cover-Schritt legt die Zeile schon mit nur
    // dem Klappentext an — als "Listing fertig" zählt erst der Titel.
    supabase
      .from("kdp_listings")
      .select("title")
      .eq("project_id", projectId)
      .maybeSingle(),
    supabase
      .from("projects")
      .select("published_at")
      .eq("id", projectId)
      .maybeSingle(),
    supabase
      .from("projects")
      .select("quality_status")
      .eq("id", projectId)
      .maybeSingle(),
  ]);

  const rows = chapters ?? [];
  const writtenCount = rows.filter((c) => Boolean(c.content)).length;
  return buildWorkflowSteps({
    projectId,
    finished: rows.length > 0 && writtenCount === rows.length,
    hasWrittenChapters: writtenCount > 0,
    hasCover: Boolean(cover),
    hasListing: Boolean(listing?.title?.trim()),
    hasQualityReport: quality?.quality_status === "fertig",
    published: Boolean(proj?.published_at),
  });
}

// Fortschritt + nächster Schritt für die Projektkarten, gebatcht über alle
// Projekte der Liste (drei .in()-Abfragen statt 3×N Einzelabfragen).
export type ProjectCardInfo = {
  done: number;
  total: number;
  current: WorkflowStep | null;
};

export async function getProjectCardInfos(
  supabase: SupabaseClient,
  projects: { id: string; published_at: string | null }[],
): Promise<Map<string, ProjectCardInfo>> {
  const infos = new Map<string, ProjectCardInfo>();
  if (!projects.length) return infos;
  const ids = projects.map((p) => p.id);

  const [{ data: chapters }, { data: covers }, { data: listings }, { data: quality }] =
    await Promise.all([
      supabase
        .from("chapters")
        .select("project_id, content, status")
        .in("project_id", ids),
      supabase
        .from("covers")
        .select("project_id")
        .in("project_id", ids)
        .eq("is_selected", true),
      supabase
        .from("kdp_listings")
        .select("project_id, title")
        .in("project_id", ids),
      // Best-effort in eigener Abfrage (Regel 2026-07-15): fehlt die Spalte,
      // gilt schlicht „kein Bericht" statt einer kaputten Projektliste.
      supabase.from("projects").select("id, quality_status").in("id", ids),
    ]);

  const qualitySet = new Set(
    (quality ?? [])
      .filter((q) => q.quality_status === "fertig")
      .map((q) => q.id),
  );
  const coverSet = new Set((covers ?? []).map((c) => c.project_id));
  const listingSet = new Set(
    (listings ?? [])
      .filter((l) => Boolean(l.title?.trim()))
      .map((l) => l.project_id),
  );

  for (const project of projects) {
    const rows = (chapters ?? []).filter((c) => c.project_id === project.id);
    const writtenCount = rows.filter((c) => Boolean(c.content)).length;
    const steps = buildWorkflowSteps({
      projectId: project.id,
      finished: rows.length > 0 && writtenCount === rows.length,
      hasWrittenChapters: writtenCount > 0,
      hasCover: coverSet.has(project.id),
      hasListing: listingSet.has(project.id),
      hasQualityReport: qualitySet.has(project.id),
      published: Boolean(project.published_at),
    });
    infos.set(project.id, {
      done: rows.filter((c) => c.status === "fertig").length,
      total: rows.length,
      current: steps.find((s) => s.status === "current") ?? null,
    });
  }
  return infos;
}
