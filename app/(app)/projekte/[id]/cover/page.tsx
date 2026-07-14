import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CoverStudio } from "@/components/buchwerk/cover-studio";
import { Button } from "@/components/ui/button";

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
    .select("id, title, topic, author, cover_title_style")
    .eq("id", id)
    .single();
  if (!project) notFound();

  const { data: covers } = await supabase
    .from("covers")
    .select("id, image_url, model, is_selected")
    .eq("project_id", id)
    .order("created_at", { ascending: false });

  // Klappentext lives in the KDP listing; surface it here so it can be written
  // before the listing step (the back cover needs it).
  const { data: listing } = await supabase
    .from("kdp_listings")
    .select("description")
    .eq("project_id", id)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Link
        href={`/projekte/${id}`}
        className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
      >
        ← Zurück zum Projekt
      </Link>

      <h1 className="font-display mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
        Cover
      </h1>
      <p className="mt-3 text-base text-muted-foreground">
        {project.title ?? project.topic}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        Generiere Cover-Motive mit Flux, wähle eins aus und lade ein
        Cover-PDF mit Vorder- und Rückseite herunter. Titel und Autor kommen
        beim PDF sauber als Text aufs Motiv.
      </p>

      <CoverStudio
        projectId={id}
        title={project.title ?? project.topic}
        author={project.author ?? ""}
        titleStyle={project.cover_title_style}
        blurb={listing?.description ?? ""}
        covers={covers ?? []}
      />

      {(covers ?? []).some((c) => c.is_selected) ? (
        <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-border pt-6">
          <p className="text-sm font-medium text-success">✓ Cover gewählt.</p>
          <Button asChild size="lg">
            <Link href={`/projekte/${id}/kdp`}>Weiter zum KDP-Listing</Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
