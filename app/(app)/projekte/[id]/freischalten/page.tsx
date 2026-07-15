import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { canAccessProject } from "@/lib/billing/access";
import { CheckoutForm } from "@/components/buchwerk/checkout-form";

export const metadata: Metadata = {
  title: "Freischalten — Buchwerk",
};

export default async function FreischaltenPage({
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

  if (await canAccessProject(supabase, id)) {
    redirect(`/projekte/${id}`);
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <Link
        href={`/projekte/${id}`}
        className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
      >
        ← Zurück zum Projekt
      </Link>

      <h1 className="font-display mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
        Buch freischalten
      </h1>
      <p className="mt-3 text-base text-muted-foreground">
        {project.title ?? project.topic}
      </p>
      <p className="mt-4 text-sm text-muted-foreground">
        Thema und Gliederung sind kostenlos. Zum Schreiben der Kapitel, fürs
        Cover, das KDP-Listing und den PDF-Download schaltest du das Buch frei —
        einmalig oder im Abo.
      </p>

      <div className="mt-6 rounded-2xl border border-border bg-card p-6">
        <p className="text-sm font-semibold text-foreground">Das bekommst du:</p>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          {[
            "Ein vollständig ausgeschriebenes Manuskript, recherchiert und als PDF zum Download",
            "Cover-Motive plus fertiges Cover-PDF (Titel & Autor)",
            "Ein komplettes KDP-Listing: Titel, Untertitel, Klappentext, 7 Keywords, Kategorien, Preisvorschlag",
            "Eine Schritt-für-Schritt-Anleitung, wie du alles bei Amazon KDP hochlädst",
          ].map((item) => (
            <li key={item} className="flex gap-2">
              <span className="text-primary">✓</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-muted-foreground">
          Hinweis: Buchwerk ist ein Werkzeug, kein Verlag. Du lädst dein fertiges
          Buch selbst bei Amazon KDP hoch (dauert wenige Minuten) und behältst
          alle Rechte und Einnahmen.
        </p>
      </div>

      <CheckoutForm projectId={id} />
    </div>
  );
}
