import "server-only";

import { PDFDocument, rgb, type PDFFont } from "pdf-lib";
import { embedBookFonts } from "@/lib/books/pdf-fonts";

// KDP-Taschenbuch-Standardformat 5,5 × 8,5 Zoll (14,0 × 21,6 cm) = 396 × 612 pt.
export const TRIM_W = 396;
export const TRIM_H = 612;
// KDP interior margins (points). Inside/gutter is wider than the outside edge and
// is mirrored per page parity (binding side). Sized for up to ~300 pages —
// buchwerk books are far shorter; KDP's minimum gutter for 24–150 pages is 0.375".
const M_INSIDE = 36; // 0.5" gutter (binding side)
const M_OUTSIDE = 27; // 0.375"
const M_TOP = 40; // ~0.55"
const M_BOTTOM = 46; // ~0.64" (leaves room for the page number)
const CONTENT_W = TRIM_W - M_INSIDE - M_OUTSIDE;
const INK = rgb(0.12, 0.12, 0.12);

type Chapter = { position: number; heading: string; content: string | null };
type Imprint = { name: string; street: string; zip: string; city: string };
type SourceGroup = {
  heading: string;
  sources: { title: string; url: string }[];
};

export type ManuscriptInput = {
  title: string;
  author: string;
  imprint: Imprint;
  chapters: Chapter[]; // already filtered to written chapters
  sourceGroups: SourceGroup[];
  year: number;
};

// Keep Latin-1 plus the German typographic characters the embedded serif has
// (real „…" quotes, en/em dashes, ellipsis, bullet); drop anything exotic so a
// missing glyph can't crash drawText.
const KEEP_EXTRA = "„“”‚‘’–—…•";
function safe(text: string): string {
  const mapped = text.replace(/ /g, " "); // nbsp → normal space (wrapping)
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
  let line = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    // Ein Wort, das allein schon breiter als die Zeile ist (typisch: URLs im
    // Quellenverzeichnis), MUSS auf Zeichenebene gebrochen werden — sonst ragt
    // es über den Satzspiegel hinaus und KDP lehnt die Datei ab ("Text
    // außerhalb der Ränder", real passiert am 04.08.).
    if (font.widthOfTextAtSize(word, size) > maxWidth) {
      if (line) {
        lines.push(line);
        line = "";
      }
      let chunk = "";
      for (const ch of word) {
        if (font.widthOfTextAtSize(chunk + ch, size) > maxWidth && chunk) {
          lines.push(chunk);
          chunk = ch;
        } else {
          chunk += ch;
        }
      }
      line = chunk;
      continue;
    }
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

/**
 * Builds the print-ready interior PDF (KDP 5.5×8.5" with mirrored margins and
 * page numbers) and returns the bytes plus the final page count — the cover's
 * spine width is derived from that count.
 */
export async function buildManuscriptPdf(
  input: ManuscriptInput,
): Promise<{ bytes: Uint8Array; pageCount: number }> {
  const { title, author, imprint, chapters, sourceGroups, year } = input;

  const pdf = await PDFDocument.create();
  const { body, bold } = await embedBookFonts(pdf);

  let page = pdf.addPage([TRIM_W, TRIM_H]);
  let y = TRIM_H - M_TOP;
  // Left text origin: on a recto (odd page number) the binding is on the left,
  // so the gutter sits there; on a verso it flips.
  let leftX = M_INSIDE;

  function newPage(): void {
    page = pdf.addPage([TRIM_W, TRIM_H]);
    leftX = pdf.getPageCount() % 2 === 1 ? M_INSIDE : M_OUTSIDE;
    y = TRIM_H - M_TOP;
  }

  function line(
    text: string,
    font: PDFFont,
    size: number,
    lineHeight: number,
  ): void {
    if (y - lineHeight < M_BOTTOM) newPage();
    y -= size;
    page.drawText(text, { x: leftX, y, size, font, color: INK });
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
    for (const l of wrap(
      safe(indent + stripInline(text)),
      font,
      size,
      CONTENT_W,
    )) {
      line(l, font, size, lineHeight);
    }
    y -= gapAfter;
  }

  // Workbook-Elemente (lib/books/book-type.ts definiert die Syntax):
  // Schreiblinien für [NOTIZFELD n] — Leser tragen hier im gedruckten Buch ein.
  function noteLines(count: number): void {
    const lineGap = 22; // genug Platz für Handschrift
    for (let i = 0; i < count; i += 1) {
      if (y - lineGap < M_BOTTOM) newPage();
      y -= lineGap;
      page.drawLine({
        start: { x: leftX, y },
        end: { x: leftX + CONTENT_W, y },
        thickness: 0.6,
        color: rgb(0.62, 0.62, 0.62),
      });
    }
    y -= 10;
  }

  // Checklisten-Zeile "- [ ] Text": gezeichnetes Kästchen (WinAnsi hat kein ☐),
  // Text daneben mit hängendem Einzug.
  function checklistItem(text: string, checked: boolean): void {
    const size = 11;
    const lineHeight = 16;
    const boxSize = 8;
    const indent = 16;
    const lines = wrap(safe(stripInline(text)), body, size, CONTENT_W - indent);
    lines.forEach((l, index) => {
      if (y - lineHeight < M_BOTTOM) newPage();
      y -= size;
      if (index === 0) {
        page.drawRectangle({
          x: leftX,
          y: y - 0.5,
          width: boxSize,
          height: boxSize,
          borderColor: INK,
          borderWidth: 0.8,
        });
        if (checked) {
          page.drawText("x", {
            x: leftX + 1.8,
            y: y + 0.5,
            size: 8,
            font: bold,
            color: INK,
          });
        }
      }
      page.drawText(l, { x: leftX + indent, y, size, font: body, color: INK });
      y -= lineHeight - size;
    });
    y -= 4;
  }

  // "[UEBUNG] Titel": abgesetzte Übungs-Überschrift mit kurzer Linie darüber.
  function exerciseHeading(text: string): void {
    y -= 10;
    if (y - 40 < M_BOTTOM) newPage();
    page.drawLine({
      start: { x: leftX, y },
      end: { x: leftX + 64, y },
      thickness: 1.4,
      color: INK,
    });
    y -= 6;
    paragraph(`Übung: ${text}`, bold, 13, 18, 6);
  }

  // --- Title page ---
  y = TRIM_H * 0.62;
  paragraph(title, bold, 26, 32, 16);
  if (author) paragraph(author, body, 14, 20, 0);

  // --- Chapters ---
  for (const chapter of chapters) {
    newPage();

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
      } else if (/^\[UEBUNG\]\s*/i.test(text)) {
        exerciseHeading(text.replace(/^\[UEBUNG\]\s*/i, ""));
      } else if (/^\[NOTIZFELD(\s+\d+)?\]$/i.test(text)) {
        const match = text.match(/\d+/);
        // 3–8 Linien — Ausreißer aus dem Modell werden eingefangen.
        noteLines(Math.min(8, Math.max(3, match ? Number(match[0]) : 4)));
      } else if (/^[-*]\s+\[( |x|X)?\]\s+/.test(text)) {
        checklistItem(
          text.replace(/^[-*]\s+\[( |x|X)?\]\s+/, ""),
          /^[-*]\s+\[(x|X)\]/.test(text),
        );
      } else if (/^[-*]\s+/.test(text)) {
        paragraph(text.replace(/^[-*]\s+/, ""), body, 11, 16, 4, "•  ");
      } else {
        paragraph(text, body, 11, 16, 8);
      }
    }
  }

  // --- Quellenverzeichnis (back matter), grouped by chapter ---
  if (sourceGroups.length > 0) {
    newPage();
    paragraph("Quellen", bold, 18, 23, 16);
    for (const group of sourceGroups) {
      paragraph(group.heading, bold, 13, 18, 8);
      for (const source of group.sources) {
        paragraph(source.title, body, 11, 16, source.url ? 2 : 8, "•  ");
        if (source.url) paragraph(source.url, body, 9, 13, 8, "   ");
      }
      y -= 6; // gap between chapters
    }
  }

  // --- Impressum (mandatory, at the very end of the book) ---
  newPage();
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

  // Page numbers, centered at the bottom — skip the title page (page 1).
  pdf.getPages().forEach((p, index) => {
    if (index === 0) return;
    const label = String(index + 1);
    const w = body.widthOfTextAtSize(label, 9);
    p.drawText(label, { x: (TRIM_W - w) / 2, y: 24, size: 9, font: body, color: INK });
  });

  const bytes = await pdf.save();
  return { bytes, pageCount: pdf.getPageCount() };
}
