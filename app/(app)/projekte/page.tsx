import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { NewProjectForm } from "@/components/buchwerk/new-project-form";

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

export default async function ProjektePage() {
  const supabase = await createClient();
  const { data: projects } = await supabase
    .from("projects")
    .select("id, title, topic, status, created_at")
    .order("created_at", { ascending: false });

  const list = projects ?? [];

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-3xl font-medium tracking-tight sm:text-4xl">
        Deine Buchprojekte
      </h1>

      <section className="mt-10 rounded-lg border border-border bg-muted p-6">
        <h2 className="text-lg font-medium">Neues Buch starten</h2>
        <p className="mt-1 mb-5 text-sm text-muted-foreground">
          Beschreib dein Thema. Buchwerk erstellt daraus eine Kapitel-Gliederung,
          die du anschließend Kapitel für Kapitel ausschreiben lässt.
        </p>
        <NewProjectForm />
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-medium">Bestehende Projekte</h2>
        {list.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Noch keine Projekte. Leg oben dein erstes Buch an.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-border border-t border-border">
            {list.map((project) => (
              <li key={project.id}>
                <Link
                  href={`/projekte/${project.id}`}
                  className="flex items-center justify-between gap-4 py-4 transition-colors hover:text-foreground"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">
                      {project.title ?? project.topic}
                    </span>
                    {project.title ? (
                      <span className="block truncate text-sm text-muted-foreground">
                        {project.topic}
                      </span>
                    ) : null}
                  </span>
                  <span className="shrink-0 text-xs uppercase tracking-wide text-muted-foreground">
                    {STATUS_LABEL[project.status] ?? project.status}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
