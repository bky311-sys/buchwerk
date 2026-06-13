import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { ChapterGenerator } from "@/components/buchwerk/chapter-generator";
import { ChapterEditor } from "@/components/buchwerk/chapter-editor";
import { ChapterContent } from "@/components/buchwerk/chapter-content";
import { EditableTitle } from "@/components/buchwerk/editable-title";
import { OutlineActions } from "@/components/buchwerk/outline-actions";

export const metadata: Metadata = {
  title: "Projekt — Buchwerk",
};

// Chapter + outline generation run inside server actions invoked from here.
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

      <div className="mt-6">
        <Button asChild variant="outline">
          <Link href={`/projekte/${project.id}/kdp`}>KDP-Listing</Link>
        </Button>
      </div>

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

            <div className="mt-5">
              <ChapterGenerator
                chapterId={chapter.id}
                hasContent={Boolean(chapter.content)}
              />
            </div>
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
