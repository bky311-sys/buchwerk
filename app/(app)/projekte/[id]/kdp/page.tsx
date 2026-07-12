import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { KdpListing } from "@/components/buchwerk/kdp-listing";

export const metadata: Metadata = {
  title: "KDP-Listing — Buchwerk",
};

// Listing generation runs inside a server action invoked from this route.
export const maxDuration = 60;

export default async function KdpPage({
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

  const { data: listing } = await supabase
    .from("kdp_listings")
    .select(
      "title, subtitle, description, keywords, categories, price_eur, price_note, updated_at",
    )
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
        KDP-Listing
      </h1>
      <p className="mt-3 text-base text-muted-foreground">
        {project.title ?? project.topic}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        Kopierfertige Texte für deinen KDP-Upload. Alles bearbeitbar, jedes Feld
        mit „Kopieren".
      </p>

      <KdpListing projectId={id} listing={listing ?? null} />
    </div>
  );
}
