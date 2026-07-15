import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { canAccessProject } from "@/lib/billing/access";
import { coerceSources } from "@/lib/books/sources";
import { manuscriptDisposition } from "@/lib/books/filename";
import { buildManuscriptPdf } from "@/lib/books/manuscript-pdf";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select(
      "title, topic, author, imprint_name, imprint_street, imprint_zip, imprint_city",
    )
    .eq("id", id)
    .single();
  if (!project) return new NextResponse("Nicht gefunden", { status: 404 });

  // Manuscript export is part of production — only for unlocked projects.
  if (!(await canAccessProject(supabase, id))) {
    return new NextResponse("Bitte zuerst freischalten", { status: 402 });
  }

  // The imprint (Impressum) is mandatory in the book — refuse the export until
  // the author has provided it.
  const imprint = {
    name: project.imprint_name?.trim() ?? "",
    street: project.imprint_street?.trim() ?? "",
    zip: project.imprint_zip?.trim() ?? "",
    city: project.imprint_city?.trim() ?? "",
  };
  if (!imprint.name || !imprint.street || !imprint.zip || !imprint.city) {
    return new NextResponse(
      "Bitte fülle zuerst das Impressum aus — es ist Pflichtangabe im Buch.",
      { status: 400 },
    );
  }

  const { data: chapters } = await supabase
    .from("chapters")
    .select("id, position, heading, content")
    .eq("project_id", id)
    .order("position");

  const written = (chapters ?? []).filter((c) => c.content?.trim());
  if (written.length === 0) {
    return new NextResponse("Noch keine geschriebenen Kapitel", {
      status: 400,
    });
  }

  // Per-chapter used sources → a Quellenverzeichnis grouped by chapter at the
  // back of the book (best-effort; empty if the sources migration lags).
  const { data: sourceRows } = await supabase
    .from("chapters")
    .select("id, sources")
    .eq("project_id", id);
  const sourceById = new Map(
    (sourceRows ?? []).map((r) => [r.id, coerceSources(r.sources)] as const),
  );
  const sourceGroups = written
    .map((c) => ({ heading: c.heading, sources: sourceById.get(c.id) ?? [] }))
    .filter((g) => g.sources.length > 0);

  const title = project.title ?? project.topic;
  const { bytes } = await buildManuscriptPdf({
    title,
    author: project.author?.trim() ?? "",
    imprint,
    chapters: written.map((c) => ({
      position: c.position,
      heading: c.heading,
      content: c.content,
    })),
    sourceGroups,
    year: new Date().getFullYear(),
  });

  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": manuscriptDisposition(title, "pdf"),
      "Cache-Control": "no-store",
    },
  });
}
