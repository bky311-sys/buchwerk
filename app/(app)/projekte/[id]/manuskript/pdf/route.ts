import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import { createClient } from "@/lib/supabase/server";
import { isProjectUnlocked } from "@/lib/billing/access";

export const runtime = "nodejs";
export const maxDuration = 60;

// A5-ish trim, comfortable margins.
const PAGE_W = 420;
const PAGE_H = 595;
const MARGIN = 50;
const CONTENT_W = PAGE_W - 2 * MARGIN;
const INK = rgb(0.12, 0.12, 0.12);

// Map characters WinAnsi (StandardFonts) can't render to safe equivalents.
function safe(text: string): string {
  const mapped = text
    .replace(/[‘’‚]/g, "'")
    .replace(/[“”„]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/ /g, " ");
  let out = "";
  for (const ch of mapped) {
    const code = ch.charCodeAt(0);
    if (ch === "\n" || (code >= 0x20 && code <= 0xff)) out += ch;
  }
  return out;
}

function wrap(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// Strip the inline markdown the chapter prompt emits (bold/italic markers).
function stripInline(text: string): string {
  return text.replace(/\*\*/g, "").replace(/(^|\s)\*(\S)/g, "$1$2");
}

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
  if (!(await isProjectUnlocked(supabase, id))) {
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
    .select("position, heading, content")
    .eq("project_id", id)
    .order("position");

  const written = (chapters ?? []).filter((c) => c.content?.trim());
  if (written.length === 0) {
    return new NextResponse("Noch keine geschriebenen Kapitel", {
      status: 400,
    });
  }

  const pdf = await PDFDocument.create();
  const body = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  let page = pdf.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN;

  // Baseline cursor helper: draws one line, advancing to a new page as needed.
  function line(
    text: string,
    font: PDFFont,
    size: number,
    lineHeight: number,
  ): void {
    if (y - lineHeight < MARGIN) {
      page = pdf.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - MARGIN;
    }
    y -= size;
    page.drawText(text, { x: MARGIN, y, size, font, color: INK });
    y -= lineHeight - size;
  }

  function paragraph(
    text: string,
    font: PDFFont,
    size: number,
    lineHeight: number,
    gapAfter: number,
    indent = "",
  ): void {
    for (const l of wrap(safe(indent + stripInline(text)), font, size, CONTENT_W)) {
      line(l, font, size, lineHeight);
    }
    y -= gapAfter;
  }

  // --- Title page ---
  const title = project.title ?? project.topic;
  const author = project.author?.trim() ?? "";
  y = PAGE_H * 0.62;
  paragraph(title, bold, 26, 32, 16);
  if (author) paragraph(author, body, 14, 20, 0);

  // --- Imprint page (Impressum, mandatory) ---
  page = pdf.addPage([PAGE_W, PAGE_H]);
  y = PAGE_H - MARGIN;
  const year = new Date().getFullYear();
  paragraph("Impressum", bold, 16, 22, 16);
  paragraph(`© ${year} ${imprint.name}`, body, 11, 16, 12);
  paragraph(imprint.name, body, 11, 16, 2);
  paragraph(imprint.street, body, 11, 16, 2);
  paragraph(`${imprint.zip} ${imprint.city}`, body, 11, 16, 14);
  paragraph(
    "Alle Rechte vorbehalten. Nachdruck oder Vervielfältigung, auch auszugsweise, nur mit ausdrücklicher Genehmigung des Autors.",
    body,
    10,
    15,
    0,
  );

  // --- Chapters ---
  for (const chapter of written) {
    page = pdf.addPage([PAGE_W, PAGE_H]);
    y = PAGE_H - MARGIN;

    paragraph(`Kapitel ${chapter.position}`, body, 10, 14, 4);
    paragraph(chapter.heading, bold, 18, 23, 18);

    const raw = (chapter.content ?? "").split("\n");
    let firstHeadingSkipped = false;
    for (const original of raw) {
      const text = original.trim();
      if (!text) {
        y -= 6; // paragraph gap
        continue;
      }
      if (text.startsWith("### ")) {
        y -= 6;
        paragraph(text.replace(/^###\s+/, ""), bold, 13, 18, 6);
      } else if (text.startsWith("## ")) {
        // First "## …" is the chapter title we already printed; skip it.
        if (!firstHeadingSkipped) {
          firstHeadingSkipped = true;
          continue;
        }
        paragraph(text.replace(/^##\s+/, ""), bold, 15, 20, 8);
      } else if (/^[-*]\s+/.test(text)) {
        paragraph(text.replace(/^[-*]\s+/, ""), body, 11, 16, 4, "•  ");
      } else {
        paragraph(text, body, 11, 16, 8);
      }
    }
  }

  const pdfBytes = await pdf.save();
  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="manuskript-${id}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
