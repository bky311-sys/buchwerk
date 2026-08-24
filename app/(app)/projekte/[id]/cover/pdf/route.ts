import { NextResponse } from "next/server";
import { PDFDocument, rgb, type PDFFont } from "pdf-lib";
import { createClient } from "@/lib/supabase/server";
import { embedBookFonts } from "@/lib/books/pdf-fonts";
import { canAccessProject } from "@/lib/billing/access";
import { averagePngColor } from "@/lib/books/image-color";
import { NEUTRAL_MAIN } from "@/lib/books/cover-style";
import { drawFrontCover } from "@/lib/books/cover-front-pdf";
import { coverDisposition } from "@/lib/books/filename";
import { coerceSources } from "@/lib/books/sources";
import { buildManuscriptPdf, TRIM_W, TRIM_H } from "@/lib/books/manuscript-pdf";

export const runtime = "nodejs";
export const maxDuration = 300;

// KDP full-wrap paperback cover geometry (points; 72 pt = 1 inch).
const BLEED = 9; // 0.125"
const SAFE = 18; // 0.25" safe margin from the trim edge
// White paper spine thickness per page (KDP: 0.002252" for white / B&W interior).
const SPINE_PER_PAGE = 0.002252 * 72;

// Keep Latin-1 plus the German typographic characters the embedded serif has.
const KEEP_EXTRA = "„“”‚‘’–—…•";
function safe(text: string): string {
  const mapped = text.replace(/ /g, " ");
  let out = "";
  for (const ch of mapped) {
    const code = ch.charCodeAt(0);
    if (ch === "\n" || (code >= 0x20 && code <= 0xff) || KEEP_EXTRA.includes(ch)) {
      out += ch;
    }
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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select(
      "title, topic, author, cover_title_style, imprint_name, imprint_street, imprint_zip, imprint_city",
    )
    .eq("id", id)
    .single();
  if (!project) return new NextResponse("Nicht gefunden", { status: 404 });

  if (!(await canAccessProject(supabase, id))) {
    return new NextResponse("Bitte zuerst freischalten", { status: 402 });
  }

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
    .select("description, subtitle")
    .eq("project_id", id)
    .maybeSingle();

  // Interior page count drives the spine width. We build the interior PDF (fast,
  // same as the manuscript download) and read its final page count.
  const { data: chapters } = await supabase
    .from("chapters")
    .select("id, position, heading, content")
    .eq("project_id", id)
    .order("position");
  const written = (chapters ?? []).filter((c) => c.content?.trim());
  if (written.length === 0) {
    return new NextResponse("Noch keine geschriebenen Kapitel", { status: 400 });
  }
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
  const author = project.author?.trim() ?? "";
  const blurb = listing?.description?.trim() ?? "";

  const { pageCount } = await buildManuscriptPdf({
    title,
    author,
    imprint: {
      name: project.imprint_name?.trim() ?? "",
      street: project.imprint_street?.trim() ?? "",
      zip: project.imprint_zip?.trim() ?? "",
      city: project.imprint_city?.trim() ?? "",
    },
    chapters: written.map((c) => ({
      position: c.position,
      heading: c.heading,
      content: c.content,
    })),
    sourceGroups,
    year: new Date().getFullYear(),
  });

  const imageResponse = await fetch(cover.image_url);
  if (!imageResponse.ok) {
    return new NextResponse("Cover-Bild nicht erreichbar", { status: 502 });
  }
  const imageBytes = new Uint8Array(await imageResponse.arrayBuffer());
  const contentType = imageResponse.headers.get("content-type") ?? "";

  const pdf = await PDFDocument.create();
  const { body: helvetica, bold: helveticaBold } = await embedBookFonts(pdf);

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

  // --- Full-wrap geometry ---
  const spineW = pageCount * SPINE_PER_PAGE;
  const totalW = 2 * TRIM_W + spineW + 2 * BLEED;
  const totalH = TRIM_H + 2 * BLEED;
  const page = pdf.addPage([totalW, totalH]);

  // Panel x-boundaries (left→right): [bleed][back trim][spine][front trim][bleed]
  const backTrimX0 = BLEED;
  const backTrimX1 = BLEED + TRIM_W;
  const spineX0 = backTrimX1;
  const spineX1 = spineX0 + spineW;
  const frontTrimX0 = spineX1;

  const main = averagePngColor(imageBytes) ?? NEUTRAL_MAIN;
  const mainRgb = rgb(main.r, main.g, main.b);
  const luminance = 0.299 * main.r + 0.587 * main.g + 0.114 * main.b;
  const darkBg = luminance < 0.5;
  const backTitleColor = darkBg ? rgb(0.97, 0.97, 0.97) : rgb(0.12, 0.12, 0.12);
  const backBodyColor = darkBg ? rgb(0.86, 0.86, 0.86) : rgb(0.28, 0.28, 0.28);

  // Whole wrap gets the cover's main colour (covers back + spine + any gaps).
  page.drawRectangle({ x: 0, y: 0, width: totalW, height: totalH, color: mainRgb });

  // --- FRONT (right panel): Motiv + Typo als geteiltes Modul (Cover 2.1) —
  // dieselbe Komposition wie lokale Test-Renderings, nie auseinanderlaufend.
  const frontArtW = totalW - frontTrimX0; // trim width + right bleed
  drawFrontCover({
    page,
    image,
    x: frontTrimX0,
    width: frontArtW,
    height: totalH,
    safeInset: SAFE,
    textMaxWidth: TRIM_W - 2 * SAFE,
    title,
    subtitle: listing?.subtitle ?? "",
    author,
    styleKey: project.cover_title_style,
    main,
    fonts: { body: helvetica, bold: helveticaBold },
  });

  // --- BACK (left panel): title + blurb, with the barcode area kept clear ---
  const backTextX = backTrimX0 + SAFE;
  const backTextW = TRIM_W - 2 * SAFE;

  // KDP prints its barcode in the lower area of the back cover — keep a clear
  // white 2"×1.2" box there (bottom-right of the back panel, inset from trim).
  const BC_W = 144;
  const BC_H = 86;
  page.drawRectangle({
    x: backTrimX1 - SAFE - BC_W,
    y: BLEED + SAFE,
    width: BC_W,
    height: BC_H,
    color: rgb(1, 1, 1),
  });
  const barcodeTop = BLEED + SAFE + BC_H;

  const backTitleLines = wrap(safe(title), helveticaBold, 20, backTextW);
  let byTitle = totalH - BLEED - SAFE - 20;
  for (const l of backTitleLines) {
    page.drawText(l, {
      x: backTextX,
      y: byTitle,
      size: 20,
      font: helveticaBold,
      color: backTitleColor,
    });
    byTitle -= 26;
  }
  if (blurb) {
    const blurbTop = byTitle - 16;
    const blurbBottom = barcodeTop + 20;
    const lh = 18;
    const maxLines = Math.max(1, Math.floor((blurbTop - blurbBottom) / lh));
    // Passt der Klappentext nicht, wird satzweise von hinten gekürzt statt
    // mitten im Satz abzuschneiden (QS-Durchlauf 23.08.: Rückseite endete mit
    // „… Dieser …“). Absatzstruktur bleibt erhalten, weil am Originaltext
    // geschnitten wird.
    const blurbText = safe(blurb);
    let shown = wrap(blurbText, helvetica, 12, backTextW);
    if (shown.length > maxLines) {
      const sentenceEnds = [...blurbText.matchAll(/[.!?](?=\s|$)/g)]
        .map((m) => m.index + 1)
        .reverse();
      for (const end of sentenceEnds) {
        const candidate = blurbText.slice(0, end).trimEnd();
        const lines = wrap(candidate, helvetica, 12, backTextW);
        if (lines.length <= maxLines) {
          shown = lines;
          break;
        }
      }
      // Notbremse (ein einziger Riesensatz): harter Zeilenschnitt mit Ellipse.
      if (shown.length > maxLines) {
        shown = shown.slice(0, maxLines);
        shown[shown.length - 1] =
          shown[shown.length - 1].replace(/\.*$/, "") + " …";
      }
    }
    let by = blurbTop;
    for (const l of shown) {
      page.drawText(l, {
        x: backTextX,
        y: by,
        size: 12,
        font: helvetica,
        color: backBodyColor,
      });
      by -= lh;
    }
  }

  const pdfBytes = await pdf.save();
  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": coverDisposition(title),
      "Cache-Control": "no-store",
    },
  });
}
