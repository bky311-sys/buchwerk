import { NextResponse } from "next/server";
import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
} from "pdf-lib";
import { createClient } from "@/lib/supabase/server";
import { isProjectUnlocked } from "@/lib/billing/access";
import { averagePngColor } from "@/lib/books/image-color";
import {
  parseCoverStyle,
  bandColorFromMain,
  bandTitleColor,
  bandAuthorColor,
  NEUTRAL_MAIN,
} from "@/lib/books/cover-style";

export const runtime = "nodejs";

const PAGE_W = 600;
const PAGE_H = 900;

function safe(text: string): string {
  const mapped = text
    .replace(/[‘’‚]/g, "'")
    .replace(/[“”„]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/ /g, " ");
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


export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("title, topic, author, cover_title_style")
    .eq("id", id)
    .single();
  if (!project) return new NextResponse("Nicht gefunden", { status: 404 });

  // PDF download is part of production — only for unlocked projects.
  if (!(await isProjectUnlocked(supabase, id))) {
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

  // The cover's dominant colour drives both the front band and the back cover,
  // so the whole cover reads as one piece.
  const main = averagePngColor(imageBytes) ?? NEUTRAL_MAIN;

  const front = pdf.addPage([PAGE_W, PAGE_H]);
  front.drawImage(image, { x: 0, y: 0, width: PAGE_W, height: PAGE_H });

  // Title and author sit on a SOLID band. The band is opaque (not a translucent
  // overlay) so it fully covers any lettering the image model may have rendered
  // into the art — the cover prompt asks for none, but Flux doesn't always
  // comply, and a see-through overlay produced "text over text". The author
  // chooses the band's placement (top/bottom) and tone (light/dark); the colour
  // is a shade of the motif's dominant colour, not pure black/white.
  const { position, tone } = parseCoverStyle(project.cover_title_style);
  const bandRgb = bandColorFromMain(main, tone);
  const titleRgb = bandTitleColor(tone);
  const authorRgb = bandAuthorColor(tone);
  const bandColor = rgb(bandRgb.r, bandRgb.g, bandRgb.b);
  const frontTitleColor = rgb(titleRgb.r, titleRgb.g, titleRgb.b);
  const authorColor = rgb(authorRgb.r, authorRgb.g, authorRgb.b);
  const accentColor = rgb(0.11, 0.42, 0.24);
  const bandAtTop = position === "oben";

  const titleSize = 32;
  const titleLineHeight = 40;
  const titleLines = wrap(safe(title), helveticaBold, titleSize, PAGE_W - 96);
  const authorBlock = author ? 44 : 0;
  const bandHeight = Math.min(
    PAGE_H * 0.5,
    titleLines.length * titleLineHeight + 96 + authorBlock,
  );
  const bandY = bandAtTop ? PAGE_H - bandHeight : 0;

  front.drawRectangle({
    x: 0,
    y: bandY,
    width: PAGE_W,
    height: bandHeight,
    color: bandColor,
  });
  // Accent strip on the band's inner edge (below a top band, above a bottom one).
  front.drawRectangle({
    x: 0,
    y: bandAtTop ? bandY - 5 : bandHeight,
    width: PAGE_W,
    height: 5,
    color: accentColor,
  });

  // Title starts near the top of the band; author sits near its bottom.
  let titleY = bandY + bandHeight - 56;
  for (const line of titleLines) {
    front.drawText(line, {
      x: 48,
      y: titleY,
      size: titleSize,
      font: helveticaBold,
      color: frontTitleColor,
    });
    titleY -= titleLineHeight;
  }
  if (author) {
    front.drawText(safe(author), {
      x: 48,
      y: bandY + 40,
      size: 18,
      font: helvetica,
      color: authorColor,
    });
  }

  const back = pdf.addPage([PAGE_W, PAGE_H]);

  // Back cover takes the cover's main colour (computed above), so front and back
  // match. Text colour flips for contrast based on the background's brightness.
  const luminance = 0.299 * main.r + 0.587 * main.g + 0.114 * main.b;
  const dark = luminance < 0.5;
  const titleColor = dark ? rgb(0.97, 0.97, 0.97) : rgb(0.12, 0.12, 0.12);
  const bodyColor = dark ? rgb(0.86, 0.86, 0.86) : rgb(0.28, 0.28, 0.28);

  back.drawRectangle({
    x: 0,
    y: 0,
    width: PAGE_W,
    height: PAGE_H,
    color: rgb(main.r, main.g, main.b),
  });

  // KDP prints its EAN-13 barcode in a fixed 2" × 1.2" area in the lower-right
  // corner (~0.125" from the edges). That area must be a solid light fill with
  // nothing in it, so we reserve a white box there and keep all text clear of it.
  const BC_W = 144; // 2"
  const BC_H = 87; // 1.2"
  const BC_MARGIN = 9; // ~0.125"
  back.drawRectangle({
    x: PAGE_W - BC_MARGIN - BC_W,
    y: BC_MARGIN,
    width: BC_W,
    height: BC_H,
    color: rgb(1, 1, 1),
  });
  const barcodeTop = BC_MARGIN + BC_H; // text must stay above this

  const backTitleLines = wrap(safe(title), helveticaBold, 22, PAGE_W - 96);
  let backTitleY = PAGE_H - 80;
  for (const line of backTitleLines) {
    back.drawText(line, {
      x: 48,
      y: backTitleY,
      size: 22,
      font: helveticaBold,
      color: titleColor,
    });
    backTitleY -= 28;
  }
  if (blurb) {
    // Start below the title (dynamic, so a long title never overlaps), and bound
    // it so it can't run into the author line or the barcode area.
    const blurbTop = backTitleY - 18;
    const blurbBottom = barcodeTop + 24; // stay clear of barcode + author
    const lineHeight = 20;
    const maxLines = Math.max(1, Math.floor((blurbTop - blurbBottom) / lineHeight));
    const lines = wrap(safe(blurb), helvetica, 13, PAGE_W - 96);
    const shown = lines.slice(0, maxLines);
    if (lines.length > maxLines && shown.length > 0) {
      shown[shown.length - 1] = shown[shown.length - 1].replace(/\.*$/, "") + " …";
    }
    let by = blurbTop;
    for (const line of shown) {
      back.drawText(line, {
        x: 48,
        y: by,
        size: 13,
        font: helvetica,
        color: bodyColor,
      });
      by -= lineHeight;
    }
  }
  if (author) {
    // Bottom-left, clear of the bottom-right barcode area.
    back.drawText(safe(author), {
      x: 48,
      y: 40,
      size: 13,
      font: helvetica,
      color: bodyColor,
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
