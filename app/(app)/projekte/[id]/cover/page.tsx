import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CoverStudio } from "@/components/buchwerk/cover-studio";

export const metadata: Metadata = {
  title: "Cover — Buchwerk",
};

// Image generation runs inside a server action invoked from this route.
export const maxDuration = 60;

export default async function CoverPage({
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

  const { data: covers } = await supabase
    .from("covers")
    .select("id, image_url, model, is_selected")
    .eq("project_id", id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Link
        href={`/projekte/${id}`}
        className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
      >
        ← Zurück zum Projekt
      </Link>

      <h1 className="mt-6 text-3xl font-medium tracking-tight sm:text-4xl">
        Cover
      </h1>
      <p className="mt-3 text-base text-muted-foreground">
        {project.title ?? project.topic}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        Generiere Cover-Motive mit Flux, probiere Varianten und wähle eins aus.
        Der Titel kommt bewusst nicht ins Bild — das Motiv bleibt sauber.
      </p>

      <CoverStudio projectId={id} covers={covers ?? []} />
    </div>
  );
}
