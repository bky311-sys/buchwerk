import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChapterGenerator } from "@/components/buchwerk/chapter-generator";

export const metadata: Metadata = {
  title: "Projekt — Buchwerk",
};

// Chapter generation runs inside a server action invoked from this route.
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

  const { data: chapters } = await supabase
    .from("chapters")
    .select("id, position, heading, summary, content, status")
    .eq("project_id", id)
    .order("position");

  const list = chapters ?? [];
  const done = list.filter((c) => c.status === "fertig").length;

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Link
        href="/projekte"
        className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
      >
        ← Alle Projekte
      </Link>

      <h1 className="mt-6 text-3xl font-medium tracking-tight sm:text-4xl">
        {project.title ?? project.topic}
      </h1>
      <p className="mt-3 text-base text-muted-foreground">{project.topic}</p>
      <p className="mt-4 text-sm text-muted-foreground">
        {done} von {list.length} Kapiteln geschrieben
      </p>

      <div className="mt-12 space-y-12">
        {list.map((chapter) => (
          <article key={chapter.id} className="border-t border-border pt-6">
            <header className="space-y-2">
              <span className="text-sm font-medium text-muted-foreground tabular-nums">
                Kapitel {chapter.position}
              </span>
              <h2 className="text-xl font-medium tracking-tight">
                {chapter.heading}
              </h2>
              {chapter.summary ? (
                <p className="text-sm text-muted-foreground">
                  {chapter.summary}
                </p>
              ) : null}
            </header>

            {chapter.content ? (
              <div className="mt-5 whitespace-pre-wrap text-base leading-relaxed">
                {chapter.content}
              </div>
            ) : (
              <p className="mt-5 text-sm text-muted-foreground">
                Dieses Kapitel ist noch nicht geschrieben.
              </p>
            )}

            <div className="mt-5">
              <ChapterGenerator
                chapterId={chapter.id}
                hasContent={Boolean(chapter.content)}
              />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
