import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isSubscriber } from "@/lib/billing/access";
import { NewProjectForm } from "@/components/buchwerk/new-project-form";
import { StatusBadge } from "@/components/buchwerk/status-badge";
import { DeleteProjectButton } from "@/components/buchwerk/delete-project-button";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Meine Projekte — Buchwerk",
};

// Outline generation runs inside the create action — give it room.
export const maxDuration = 60;

const STATUS_LABEL: Record<string, string> = {
  entwurf: "Entwurf",
  gliederung: "Gliederung",
  gliederung_läuft: "Gliederung läuft…",
  schreiben: "In Arbeit",
  fertig: "Fertig",
};

function statusIntent(status: string): "done" | "draft" | "neutral" {
  if (status === "fertig") return "done";
  if (status === "schreiben" || status === "gliederung_läuft") return "draft";
  return "neutral";
}

export default async function ProjektePage({
  searchParams,
}: {
  searchParams: Promise<{ thema?: string }>;
}) {
  const { thema } = await searchParams;
  const defaultTopic =
    typeof thema === "string" ? thema.trim().slice(0, 300) : undefined;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [{ data: projects }, subscriber] = await Promise.all([
    supabase
      .from("projects")
      .select("id, title, topic, status, created_at, published_at")
      .order("created_at", { ascending: false }),
    user ? isSubscriber(supabase, user.id) : Promise.resolve(false),
  ]);

  const list = projects ?? [];
  const hasProjects = list.length > 0;

  // Subscribers write/produce within their monthly quota — no per-book payment.
  const produceCost = subscriber
    ? "Als Abonnent ist das im Rahmen deines Monatskontingents ohne Extrakosten."
    : "Ab hier einmalig 19,99 € pro Buch (oder im Abo inklusive).";

  const stepsIntro = (
    <ol className="mt-6 grid gap-4 sm:grid-cols-3">
      {[
        {
          t: "1 · Thema & Gliederung",
          d: "Thema eingeben — Buchwerk erstellt Titel und Kapitel-Gliederung. Kostenlos und unverbindlich.",
        },
        {
          t: "2 · Schreiben, Cover, Listing",
          d: `Kapitel recherchiert ausschreiben, Cover gestalten, KDP-Texte erzeugen. ${produceCost}`,
        },
        {
          t: "3 · Bei Amazon veröffentlichen",
          d: "Manuskript-PDF, Cover und KDP-Texte selbst bei Amazon KDP hochladen — mit Anleitung.",
        },
      ].map((step) => (
        <li
          key={step.t}
          className="rounded-2xl border border-border bg-card p-5"
        >
          <p className="font-display text-sm font-bold text-primary">{step.t}</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {step.d}
          </p>
        </li>
      ))}
    </ol>
  );

  const createSection = (
    <section
      id="neu"
      className="rounded-2xl border border-border bg-card p-6 scroll-mt-24 sm:p-7"
    >
      <h2 className="font-display text-lg font-semibold">Neues Buch starten</h2>
      <p className="mt-1 mb-5 text-sm text-muted-foreground">
        Beschreib dein Thema. Buchwerk erstellt daraus eine Kapitel-Gliederung —{" "}
        <span className="font-medium text-foreground">kostenlos</span>.{" "}
        {subscriber
          ? "Schreiben, Cover und KDP-Listing sind mit deinem Abo abgedeckt."
          : "Erst zum Schreiben, Cover und KDP-Listing zahlst du."}
      </p>
      <NewProjectForm defaultTopic={defaultTopic} />
    </section>
  );

  const existingSection = (
    <section>
      <h2 className="font-display text-lg font-semibold">Bestehende Projekte</h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {list.map((project) => (
          <li key={project.id} className="relative">
            <Link
              href={`/projekte/${project.id}`}
              className="flex h-full items-start justify-between gap-4 rounded-2xl border border-border bg-card p-5 pb-9 transition-colors hover:border-primary/40"
            >
              <span className="min-w-0">
                <span className="block truncate font-semibold text-foreground">
                  {project.title ?? project.topic}
                </span>
                {project.title ? (
                  <span className="mt-1 block truncate text-sm text-muted-foreground">
                    {project.topic}
                  </span>
                ) : null}
              </span>
              {project.published_at ? (
                <StatusBadge intent="done">✓ Veröffentlicht</StatusBadge>
              ) : (
                <StatusBadge intent={statusIntent(project.status)}>
                  {STATUS_LABEL[project.status] ?? project.status}
                </StatusBadge>
              )}
            </Link>
            <div className="absolute bottom-3 right-4">
              <DeleteProjectButton
                projectId={project.id}
                title={project.title ?? project.topic}
                published={Boolean(project.published_at)}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Deine Buchprojekte
        </h1>
        {hasProjects ? (
          <Button asChild size="lg">
            <Link href="#neu">+ Neues Projekt starten</Link>
          </Button>
        ) : null}
      </div>

      {hasProjects ? (
        <div className="mt-8 space-y-12">
          {existingSection}
          {createSection}
        </div>
      ) : (
        <>
          {stepsIntro}
          <div className="mt-8">{createSection}</div>
          <section className="mt-12">
            <h2 className="font-display text-lg font-semibold">
              Bestehende Projekte
            </h2>
            <p className="mt-4 text-sm text-muted-foreground">
              Noch keine Projekte. Leg oben dein erstes Buch an.
            </p>
          </section>
        </>
      )}
    </div>
  );
}
