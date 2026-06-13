import { NextResponse } from "next/server";
import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const PAGE_W = 600;
const PAGE_H = 900; // 2:3, matches the generated cover aspect

// pdf-lib's standard fonts use WinAnsi (CP1252). Map smart punctuation to ASCII,
// keep newlines + printable Latin-1, drop the rest so drawText never throws.
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
  for (const paragraph of text.split(/\n+/)) {
    let line = "";
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    lines.push(line);
  }
  return lines;
}

type TextOpts = {
  font: PDFFont;
  size: number;
  color: ReturnType<typeof rgb>;
  x: number;
  yTop: number;
  maxWidth: number;
  lineHeight: number;
};

function drawWrapped(page: PDFPage, text: string, opts: TextOpts): void {
  const lines = wrap(safe(text), opts.font, opts.size, opts.maxWidth);
  let y = opts.yTop;
  for (const line of lines) {
    page.drawText(line, {
      x: opts.x,
      y,
      size: opts.size,
      font: opts.font,
      color: opts.color,
    });
    y -= opts.lineHeight;
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("title, topic, author")
    .eq("id", id)
    .single();
  if (!project) return new NextResponse("Nicht gefunden", { status: 404 });

  const { data: cover } = await supabase
    .from("covers")
    .select("image_url")
    .eq("project_id", id)
    .eq("is_selected", true)
    .maybeSingle();
  if (!cover) {
    return new NextResponse("Kein Cover ausgewählt", { status: 400 });
  }

  const { data: listing } = await supabase
    .from("kdp_listings")
    .select("description")
    .eq("project_id", id)
    .maybeSingle();

  const imageResponse = await fetch(cover.image_url);
  if (!imageResponse.ok) {
    return new NextResponse("Cover-Bild nicht erreichbar", { status: 502 });
  }
  const imageBytes = new Uint8Array(await imageResponse.arrayBuffer());
  const contentType = imageResponse.headers.get("content-type") ?? "";

  const pdf = await PDFDocument.create();
  const helvetica = await pdf.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  let image;
  try {
    image = contentType.includes("png")
      ? await pdf.embedPng(imageBytes)
      : await pdf.embedJpg(imageBytes);
  } catch {
    return new NextResponse(
      "Dieses Cover-Format lässt sich nicht einbetten. Bitte das Cover neu generieren.",
      { status: 422 },
    );
  }

  const title = project.title ?? project.topic;
  const author = project.author?.trim() ?? "";
  const blurb = listing?.description?.trim() ?? "";

  // --- Front: full-bleed image + bottom scrim + title + author ---
  const front = pdf.addPage([PAGE_W, PAGE_H]);
  front.drawImage(image, { x: 0, y: 0, width: PAGE_W, height: PAGE_H });
  front.drawRectangle({
    x: 0,
    y: 0,
    width: PAGE_W,
    height: 300,
    color: rgb(0, 0, 0),
    opacity: 0.5,
  });
  drawWrapped(front, title, {
    font: helveticaBold,
    size: 34,
    color: rgb(1, 1, 1),
    x: 40,
    yTop: 200,
    maxWidth: PAGE_W - 80,
    lineHeight: 40,
  });
  if (author) {
    front.drawText(safe(author), {
      x: 40,
      y: 56,
      size: 18,
      font: helvetica,
      color: rgb(1, 1, 1),
    });
  }

  // --- Back: brand-sand background + title + blurb + author ---
  const back = pdf.addPage([PAGE_W, PAGE_H]);
  back.drawRectangle({
    x: 0,
    y: 0,
    width: PAGE_W,
    height: PAGE_H,
    color: rgb(0.961, 0.945, 0.922), // #F5F1EB
  });
  drawWrapped(back, title, {
    font: helveticaBold,
    size: 22,
    color: rgb(0.12, 0.12, 0.12),
    x: 48,
    yTop: PAGE_H - 80,
    maxWidth: PAGE_W - 96,
    lineHeight: 28,
  });
  if (blurb) {
    drawWrapped(back, blurb, {
      font: helvetica,
      size: 13,
      color: rgb(0.22, 0.22, 0.22),
      x: 48,
      yTop: PAGE_H - 150,
      maxWidth: PAGE_W - 96,
      lineHeight: 20,
    });
  }
  if (author) {
    back.drawText(safe(author), {
      x: 48,
      y: 56,
      size: 13,
      font: helvetica,
      color: rgb(0.35, 0.35, 0.35),
    });
  }

  const pdfBytes = await pdf.save();

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="cover-${id}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
