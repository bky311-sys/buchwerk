import { rgb, type PDFFont, type PDFImage, type PDFPage } from "pdf-lib";
import {
  parseCoverStyle,
  bandColorFromMain,
  bandTitleColor,
  bandAuthorColor,
  type RGB,
} from "@/lib/books/cover-style";
import {
  accentColorFromMain,
  pickAccentWordIndex,
  scrimColor,
  fitTitle,
  splitCoverTitle,
} from "@/lib/books/cover-layout";

// Front-Cover-Komposition für PDFs (Cover 2.1): ein Modul für die
// Full-Wrap-Route UND lokale Vorschau-/Test-Renderings, damit die Typografie
// nie zwischen Export-Wegen auseinanderläuft. Zeichnet Motiv, Fläche
// (Band/Scrim/ohne), Titel (adaptiv, Akzentwort, links/zentriert),
// Untertitel und Autor.

// Latin-1 + deutsche typografische Zeichen der eingebetteten Schriften.
const KEEP_EXTRA = "„“”‚‘’–—…•";
function safeText(text: string): string {
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

function wrapText(
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
    if (line) lines.push(line);
  }
  return lines;
}

export function drawFrontCover(opts: {
  page: PDFPage;
  image: PDFImage;
  /** Linke Kante des Front-Panels (Full-Wrap: hinter dem Rücken). */
  x: number;
  /** Panelbreite inkl. rechtem Beschnitt. */
  width: number;
  /** Seitenhöhe inkl. Beschnitt. */
  height: number;
  /** Sicherheitsabstand der Typo von der linken Panelkante. */
  safeInset: number;
  /** Maximale Textbreite (Trim minus 2× Sicherheitsabstand). */
  textMaxWidth: number;
  title: string;
  subtitle: string;
  author: string;
  styleKey: string | null | undefined;
  main: RGB;
  fonts: { body: PDFFont; bold: PDFFont };
}): void {
  const {
    page,
    image,
    x,
    width,
    height,
    safeInset,
    textMaxWidth,
    styleKey,
    main,
    fonts,
  } = opts;

  // Motiv füllt das Panel (object-cover).
  const imgScale = Math.max(width / image.width, height / image.height);
  const dw = image.width * imgScale;
  const dh = image.height * imgScale;
  page.drawImage(image, {
    x,
    y: (height - dh) / 2,
    width: dw,
    height: dh,
  });

  const { position, tone, surface, align } = parseCoverStyle(styleKey);
  const tRgb = bandTitleColor(tone);
  const aRgb = bandAuthorColor(tone);
  const accent = accentColorFromMain(main, tone);
  const accentRgb = rgb(accent.r, accent.g, accent.b);
  const atTop = position === "oben";

  // Doppelpunkt-Titel automatisch splitten: Haupttitel riesig, Rest als
  // Untertitel — sonst quetscht ein langer Ratgeber-Titel die Schrift klein.
  const split = splitCoverTitle(opts.title, opts.subtitle);
  const title = safeText(split.title);
  const subtitle = safeText(split.subtitle);
  const author = safeText(opts.author.trim());

  // Adaptive Titelgröße (Thumbnail-Regel: so groß wie möglich). baseSize 66:
  // kurze Haupttitel brechen bewusst in 2 riesige Zeilen — der Big-Type-Look;
  // lange Titel ohne Doppelpunkt dürfen 5 Zeilen nutzen, bevor sie schrumpfen.
  const fitted = fitTitle(
    title,
    textMaxWidth,
    (text, s) => fonts.bold.widthOfTextAtSize(text, s),
    { baseSize: 66, minSize: 20, maxLines: 5 },
  );

  const subtitleSize = 13;
  const subtitleLh = 17;
  const subtitleLines = subtitle
    ? wrapText(subtitle, fonts.body, subtitleSize, textMaxWidth).slice(0, 3)
    : [];
  // Vorlagen ohne Fläche mit Titel oben (Zentrum & Symbol, Premium …) führen
  // den Autor klassisch ganz unten auf dem Cover — nicht in der Titelzone.
  const authorAtBottom = surface === "none" && atTop;
  const authorBlock = author && !authorAtBottom ? 42 : 0;
  // Ohne Fläche mehr Innenabstand: die Vorlagen-Motive tragen Randelemente
  // (Ornamentrahmen, Akzentformen) — der Titel darf nicht daran kleben.
  const topInset = surface === "none" ? safeInset * 2.4 : safeInset;
  const zoneH = Math.min(
    height * 0.55,
    fitted.lines.length * fitted.lineHeight +
      (subtitleLines.length ? 10 + subtitleLines.length * subtitleLh : 0) +
      safeInset +
      topInset +
      40 +
      authorBlock,
  );
  const zoneY = atTop ? height - zoneH : 0;

  if (surface === "scrim") {
    // pdf-lib kennt keine Verläufe — Treppe aus 24 Stufen mit fallender
    // Deckkraft (im Druck glatt; per pdftoppm verifiziert).
    const sc = scrimColor(main, tone);
    const scRgb = rgb(sc.r, sc.g, sc.b);
    const extra = Math.min(height - zoneH, zoneH * 0.4);
    page.drawRectangle({ x, y: zoneY, width, height: zoneH, color: scRgb });
    const steps = 24;
    for (let i = 0; i < steps; i += 1) {
      const h = extra / steps;
      const yy = atTop ? zoneY - (i + 1) * h : zoneY + zoneH + i * h;
      page.drawRectangle({
        x,
        y: yy,
        width,
        height: h + 0.5,
        color: scRgb,
        opacity: 1 - (i + 1) / steps,
      });
    }
  } else if (surface === "band") {
    const bandRgb = bandColorFromMain(main, tone);
    page.drawRectangle({
      x,
      y: zoneY,
      width,
      height: zoneH,
      color: rgb(bandRgb.r, bandRgb.g, bandRgb.b),
    });
    // Akzentstreifen in der Kontrastfarbe des Motivs.
    page.drawRectangle({
      x,
      y: atTop ? zoneY - 5 : zoneY + zoneH,
      width,
      height: 5,
      color: accentRgb,
    });
  }
  // surface "none": das Vorlagen-Motiv liefert die ruhige Fläche selbst.

  const lineX = (line: string, size: number, font: PDFFont): number => {
    if (align !== "mitte") return x + safeInset;
    const w = font.widthOfTextAtSize(line, size);
    return x + safeInset + Math.max(0, (textMaxWidth - w) / 2);
  };

  // Titel mit hervorgehobenem Schlüsselwort (Blickanker in Akzentfarbe).
  const accentIndex = pickAccentWordIndex(title);
  let wordCursor = 0;
  let ty = zoneY + zoneH - topInset - fitted.size;
  for (const l of fitted.lines) {
    let tx = lineX(l, fitted.size, fonts.bold);
    for (const word of l.split(" ")) {
      page.drawText(word, {
        x: tx,
        y: ty,
        size: fitted.size,
        font: fonts.bold,
        color:
          wordCursor === accentIndex ? accentRgb : rgb(tRgb.r, tRgb.g, tRgb.b),
      });
      tx += fonts.bold.widthOfTextAtSize(`${word} `, fitted.size);
      wordCursor += 1;
    }
    ty -= fitted.lineHeight;
  }
  if (subtitleLines.length) {
    ty -= 4;
    for (const l of subtitleLines) {
      page.drawText(l, {
        x: lineX(l, subtitleSize, fonts.body),
        y: ty,
        size: subtitleSize,
        font: fonts.body,
        color: rgb(aRgb.r, aRgb.g, aRgb.b),
      });
      ty -= subtitleLh;
    }
  }
  if (author) {
    // Zentrierte Layouts führen den Autor in Versalien (Premium-Konvention);
    // bei Vorlagen ohne Fläche mit Titel oben steht er ganz unten auf dem
    // Cover (sonst kollidierte er mit dem Untertitel — Testrender 14.08.).
    const authorText = align === "mitte" ? author.toUpperCase() : author;
    const authorSize = align === "mitte" ? 13 : 16;
    page.drawText(authorText, {
      x: lineX(authorText, authorSize, fonts.body),
      y: authorAtBottom ? safeInset + 26 : zoneY + safeInset + 6,
      size: authorSize,
      font: fonts.body,
      color: rgb(aRgb.r, aRgb.g, aRgb.b),
    });
  }
}
