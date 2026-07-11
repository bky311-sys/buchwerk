import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { NewProjectForm } from "@/components/buchwerk/new-project-form";
import { StatusBadge } from "@/components/buchwerk/status-badge";

export const metadata: Metadata = {
  title: "Meine Projekte — Buchwerk",
};

// Outline generation runs inside the create action — give it room.
export const maxDuration = 60;

const STATUS_LABEL: Record<string, string> = {
  entwurf: "Entwurf",
  gliederung: "Gliederung",
  schreiben: "In Arbeit",
  fertig: "Fertig",
};

function statusIntent(status: string): "done" | "draft" | "neutral" {
  if (status === "fertig") return "done";
  if (status === "schreiben") return "draft";
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
  const { data: projects } = await supabase
    .from("projects")
    .select("id, title, topic, status, created_at")
    .order("created_at", { ascending: false });

  const list = projects ?? [];

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
        Deine Buchprojekte
      </h1>

      <section className="mt-10 rounded-2xl border border-border bg-card p-6 sm:p-7">
        <h2 className="font-display text-lg font-semibold">
          Neues Buch starten
        </h2>
        <p className="mt-1 mb-5 text-sm text-muted-foreground">
          Beschreib dein Thema. Buchwerk erstellt daraus eine Kapitel-Gliederung,
          die du anschließend Kapitel für Kapitel ausschreiben lässt.
        </p>
        <NewProjectForm defaultTopic={defaultTopic} />
      </section>

      <section className="mt-12">
        <h2 className="font-display text-lg font-semibold">
          Bestehende Projekte
        </h2>
        {list.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Noch keine Projekte. Leg oben dein erstes Buch an.
          </p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {list.map((project) => (
              <li key={project.id}>
                <Link
                  href={`/projekte/${project.id}`}
                  className="flex h-full items-start justify-between gap-4 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
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
                  <StatusBadge intent={statusIntent(project.status)}>
                    {STATUS_LABEL[project.status] ?? project.status}
                  </StatusBadge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
