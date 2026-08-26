import "server-only";

import fs from "node:fs";
import path from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { StandardFonts, type PDFDocument, type PDFFont } from "pdf-lib";

// Embedded book font: Source Serif 4 (Regular + Bold), converted to TTF and
// committed under lib/fonts. Real embedding (via @pdf-lib/fontkit) means KDP no
// longer has to auto-embed base fonts — and a serif reads far better in print
// than pdf-lib's built-in Helvetica.
//
// next.config.ts must keep these .ttf files in the serverless bundle via
// outputFileTracingIncludes, since they're read from disk at runtime.

const cache = new Map<string, Uint8Array>();

function read(name: string): Uint8Array {
  const hit = cache.get(name);
  if (hit) return hit;
  const bytes = fs.readFileSync(path.join(process.cwd(), "lib/fonts", name));
  cache.set(name, bytes);
  return bytes;
}

/**
 * Zweite Cover-Schrift (Cover 3.0): Bricolage Grotesque Bold — die
 * Display-Schrift der Marke, statisch auf Gewicht 700 instanziiert. Wird nur
 * fürs Cover eingebettet; scheitert das Laden, fällt der Aufrufer auf die
 * Serif zurück (kein 500 im Export).
 */
export async function embedCoverDisplayFont(
  pdf: PDFDocument,
): Promise<PDFFont | null> {
  try {
    pdf.registerFontkit(fontkit);
    return await pdf.embedFont(read("grotesk-bold.ttf"), { subset: true });
  } catch {
    return null;
  }
}

export async function embedBookFonts(
  pdf: PDFDocument,
): Promise<{ body: PDFFont; bold: PDFFont }> {
  try {
    pdf.registerFontkit(fontkit);
    const body = await pdf.embedFont(read("serif-regular.ttf"), {
      subset: true,
    });
    const bold = await pdf.embedFont(read("serif-bold.ttf"), { subset: true });
    return { body, bold };
  } catch {
    // Safety net: if the font files aren't in the bundle at runtime, fall back
    // to the built-in fonts (KDP then auto-embeds) so the export never 500s.
    const body = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    return { body, bold };
  }
}
