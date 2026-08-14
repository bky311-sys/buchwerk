import { NextResponse } from "next/server";
import { PDFDocument, rgb, type PDFFont } from "pdf-lib";
import { createClient } from "@/lib/supabase/server";
import { embedBookFonts } from "@/lib/books/pdf-fonts";
import { canAccessProject } from "@/lib/billing/access";
import { averagePngColor } from "@/lib/books/image-color";
import {
  parseCoverStyle,
  bandColorFromMain,
  bandTitleColor,
  bandAuthorColor,
  NEUTRAL_MAIN,
} from "@/lib/books/cover-style";
import {
  accentColorFromMain,
  pickAccentWordIndex,
  scrimColor,
  fitTitle,
} from "@/lib/books/cover-layout";
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

  // --- FRONT (right panel): motif fills to the bleed edges + title band ---
  const frontArtW = totalW - frontTrimX0; // trim width + right bleed
  const imgScale = Math.max(frontArtW / image.width, totalH / image.height);
  const dw = image.width * imgScale;
  const dh = image.height * imgScale;
  page.drawImage(image, {
    x: frontTrimX0, // left edge sits on the spine (no bleed into the spine)
    y: (totalH - dh) / 2,
    width: dw,
    height: dh,
  });

  const { position, tone, surface } = parseCoverStyle(project.cover_title_style);
  const tRgb = bandTitleColor(tone);
  const aRgb = bandAuthorColor(tone);
  const accent = accentColorFromMain(main, tone);
  const accentRgb = rgb(accent.r, accent.g, accent.b);
  const bandAtTop = position === "oben";
  const subtitle = listing?.subtitle?.trim() ?? "";

  // Cover 2.0: adaptive Titelgröße (kurze Titel groß — Thumbnail-Regel),
  // muss dem Canvas-Export in cover-studio proportional entsprechen
  // (Canvas 1600px ↔ Front-Panel ~405pt: Faktor ~0.25).
  const safeTitle = safe(title);
  const fitted = fitTitle(
    safeTitle,
    TRIM_W - 2 * SAFE,
    (text, s) => helveticaBold.widthOfTextAtSize(text, s),
    { baseSize: 38, minSize: 18, maxLines: 4 },
  );

  const subtitleSize = 13;
  const subtitleLh = 17;
  const subtitleLines = subtitle
    ? wrap(safe(subtitle), helvetica, subtitleSize, TRIM_W - 2 * SAFE).slice(0, 3)
    : [];
  const authorBlock = author ? 42 : 0;
  const bandH = Math.min(
    totalH * 0.55,
    fitted.lines.length * fitted.lineHeight +
      (subtitleLines.length ? 10 + subtitleLines.length * subtitleLh : 0) +
      2 * SAFE +
      40 +
      authorBlock,
  );
  const bandY = bandAtTop ? totalH - bandH : 0;

  if (surface === "scrim") {
    // pdf-lib kennt keine Verläufe — der Scrim wird als Treppe aus schmalen
    // Rechtecken mit abnehmender Deckkraft gezeichnet (24 Stufen reichen im
    // Druck; verifiziert per pdftoppm-Rendering).
    const sc = scrimColor(main, tone);
    const scRgb = rgb(sc.r, sc.g, sc.b);
    const extra = Math.min(totalH - bandH, bandH * 0.4);
    page.drawRectangle({
      x: frontTrimX0,
      y: bandY,
      width: frontArtW,
      height: bandH,
      color: scRgb,
    });
    const steps = 24;
    for (let i = 0; i < steps; i += 1) {
      const h = extra / steps;
      const y = bandAtTop ? bandY - (i + 1) * h : bandY + bandH + i * h;
      page.drawRectangle({
        x: frontTrimX0,
        y,
        width: frontArtW,
        height: h + 0.5, // minimal überlappen gegen Rendering-Fugen
        color: scRgb,
        opacity: 1 - (i + 1) / steps,
      });
    }
  } else {
    const bandRgb = bandColorFromMain(main, tone);
    // Band spans the whole front art width (bleeds to the right/top/bottom edge).
    page.drawRectangle({
      x: frontTrimX0,
      y: bandY,
      width: frontArtW,
      height: bandH,
      color: rgb(bandRgb.r, bandRgb.g, bandRgb.b),
    });
    // Akzentstreifen in der Kontrastfarbe des Motivs (nicht mehr fix grün).
    page.drawRectangle({
      x: frontTrimX0,
      y: bandAtTop ? bandY - 5 : bandY + bandH,
      width: frontArtW,
      height: 5,
      color: accentRgb,
    });
  }

  const frontTextX = frontTrimX0 + SAFE;
  const accentIndex = pickAccentWordIndex(safeTitle);
  let wordCursor = 0;
  let ty = bandY + bandH - SAFE - fitted.size;
  for (const l of fitted.lines) {
    let tx = frontTextX;
    for (const word of l.split(" ")) {
      page.drawText(word, {
        x: tx,
        y: ty,
        size: fitted.size,
        font: helveticaBold,
        color: wordCursor === accentIndex ? accentRgb : rgb(tRgb.r, tRgb.g, tRgb.b),
      });
      tx += helveticaBold.widthOfTextAtSize(`${word} `, fitted.size);
      wordCursor += 1;
    }
    ty -= fitted.lineHeight;
  }
  if (subtitleLines.length) {
    ty -= 4;
    for (const l of subtitleLines) {
      page.drawText(l, {
        x: frontTextX,
        y: ty,
        size: subtitleSize,
        font: helvetica,
        color: rgb(aRgb.r, aRgb.g, aRgb.b),
      });
      ty -= subtitleLh;
    }
  }
  if (author) {
    page.drawText(safe(author), {
      x: frontTextX,
      y: bandY + SAFE + 6,
      size: 16,
      font: helvetica,
      color: rgb(aRgb.r, aRgb.g, aRgb.b),
    });
  }

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
    const lines = wrap(safe(blurb), helvetica, 12, backTextW);
    const shown = lines.slice(0, maxLines);
    if (lines.length > maxLines && shown.length > 0) {
      shown[shown.length - 1] =
        shown[shown.length - 1].replace(/\.*$/, "") + " …";
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
