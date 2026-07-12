import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isProjectUnlocked } from "@/lib/billing/access";
import { buildEpub } from "@/lib/books/epub";

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

  if (!(await isProjectUnlocked(supabase, id))) {
    return new NextResponse("Bitte zuerst freischalten", { status: 402 });
  }

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
    .select("heading, content")
    .eq("project_id", id)
    .order("position");

  const written = (chapters ?? []).filter((c) => c.content?.trim());
  if (written.length === 0) {
    return new NextResponse("Noch keine geschriebenen Kapitel", {
      status: 400,
    });
  }

  const now = new Date();
  const epub = await buildEpub({
    title: project.title ?? project.topic,
    author: project.author?.trim() ?? "",
    imprint,
    chapters: written,
    modified: now.toISOString().replace(/\.\d+Z$/, "Z"),
    uuid: crypto.randomUUID(),
    year: now.getFullYear(),
  });

  return new NextResponse(Buffer.from(epub), {
    headers: {
      "Content-Type": "application/epub+zip",
      "Content-Disposition": `attachment; filename="buch-${id}.epub"`,
      "Cache-Control": "no-store",
    },
  });
}
