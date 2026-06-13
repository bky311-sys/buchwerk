import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isProjectUnlocked } from "@/lib/billing/access";
import { Button } from "@/components/ui/button";
import { ChapterGenerator } from "@/components/buchwerk/chapter-generator";
import { ChapterEditor } from "@/components/buchwerk/chapter-editor";
import { ChapterContent } from "@/components/buchwerk/chapter-content";
import { EditableTitle } from "@/components/buchwerk/editable-title";
import { OutlineActions } from "@/components/buchwerk/outline-actions";

export const metadata: Metadata = {
  title: "Projekt — Buchwerk",
};

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

  const [{ data: chapters }, unlocked] = await Promise.all([
    supabase
      .from("chapters")
      .select("id, position, heading, summary, content, status")
      .eq("project_id", id)
      .order("position"),
    isProjectUnlocked(supabase, id),
  ]);

  const list = chapters ?? [];
  const done = list.filter((c) => c.status === "fertig").length;
  const hasWrittenChapters = list.some((c) => Boolean(c.content));

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
      <p className="mt-4 text-sm text-muted-foreground">
        {done} von {list.length} Kapiteln geschrieben
      </p>

      {!unlocked ? (
        <div className="mt-6 rounded-lg border border-border bg-muted p-5">
          <p className="text-sm font-medium">Dieses Buch ist noch nicht freigeschaltet.</p>
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
        <div className="mt-6 flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href={`/projekte/${project.id}/kdp`}>KDP-Listing</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/projekte/${project.id}/cover`}>Cover</Link>
          </Button>
        </div>
      )}

      <div className="mt-12 space-y-12">
        {list.map((chapter, index) => (
          <article key={chapter.id} className="border-t border-border pt-6">
            <ChapterEditor
              chapterId={chapter.id}
              number={index + 1}
              heading={chapter.heading}
              summary={chapter.summary ?? ""}
              isFirst={index === 0}
              isLast={index === list.length - 1}
              hasContent={Boolean(chapter.content)}
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
                />
              </div>
            ) : null}
          </article>
        ))}
      </div>

      <div className="mt-12 border-t border-border pt-6">
        <OutlineActions
          projectId={project.id}
          hasWrittenChapters={hasWrittenChapters}
        />
      </div>
    </div>
  );
}
