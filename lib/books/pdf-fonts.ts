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

let regularBytes: Uint8Array | null = null;
let boldBytes: Uint8Array | null = null;

function read(name: string): Uint8Array {
  if (name === "serif-bold.ttf") {
    boldBytes ??= fs.readFileSync(path.join(process.cwd(), "lib/fonts", name));
    return boldBytes;
  }
  regularBytes ??= fs.readFileSync(path.join(process.cwd(), "lib/fonts", name));
  return regularBytes;
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
