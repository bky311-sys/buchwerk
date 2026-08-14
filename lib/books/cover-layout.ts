import type { RGB, CoverTone } from "@/lib/books/cover-style";

// Cover-Typografie 2.0 (Marketing-Umbau 14.08.): ein Amazon-Cover verkauft als
// ~100px-Thumbnail. Deshalb: (1) Akzentfarbe als KONTRAST zur Motivfarbe statt
// Ton-in-Ton — Komplementär in HSL, damit der Akzentstreifen und das
// hervorgehobene Titelwort vom Motiv abstechen. (2) Ein Schlüsselwort im Titel
// wird farblich hervorgehoben (Blickanker). (3) Die Titelgröße passt sich der
// Titellänge an — kurze Titel werden RIESIG, lange bleiben lesbar.
//
// Pure module — läuft im Browser (Canvas/Preview) und auf dem Server (PDF).
// Alle Funktionen sind deterministisch: gleicher Input → gleiches Cover.

// --- Farbmathe -------------------------------------------------------------

function rgbToHsl({ r, g, b }: RGB): { h: number; s: number; l: number } {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return { h, s, l };
}

function hslToRgb(h: number, s: number, l: number): RGB {
  if (s === 0) return { r: l, g: l, b: l };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue = (t: number) => {
    let x = t;
    if (x < 0) x += 1;
    if (x > 1) x -= 1;
    if (x < 1 / 6) return p + (q - p) * 6 * x;
    if (x < 1 / 2) return q;
    if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6;
    return p;
  };
  return { r: hue(h + 1 / 3), g: hue(h), b: hue(h - 1 / 3) };
}

// Kräftiges Buchwerk-Terrakotta als Fallback, wenn das Motiv (fast) grau ist —
// Komplementär von Grau wäre wieder Grau, und Grau verkauft nicht.
const FALLBACK_ACCENT: RGB = { r: 0.85, g: 0.4, b: 0.16 };

/**
 * Akzentfarbe = Komplementär der Motivfarbe, auf Werbe-Sättigung angehoben.
 * `tone` steuert die Helligkeit so, dass der Akzent auf dem Band/Scrim des
 * jeweiligen Tons sicher lesbar bleibt (dunkler Grund → heller Akzent).
 */
export function accentColorFromMain(main: RGB, tone: CoverTone): RGB {
  const { h, s } = rgbToHsl(main);
  if (s < 0.12) {
    // Entsättigtes Motiv: fester kräftiger Akzent, nach Ton angepasst.
    return tone === "dunkel"
      ? { r: 0.95, g: 0.55, b: 0.25 }
      : FALLBACK_ACCENT;
  }
  const accentHue = (h + 0.5) % 1;
  // Sättigung hoch, Helligkeit je nach Untergrund: hell genug auf dunklem
  // Band, dunkel genug auf hellem.
  const lightness = tone === "dunkel" ? 0.62 : 0.42;
  return hslToRgb(accentHue, 0.72, lightness);
}

// --- Schlüsselwort ---------------------------------------------------------

const STOPWORDS = new Set([
  "der", "die", "das", "den", "dem", "des", "ein", "eine", "einen", "einem",
  "einer", "eines", "und", "oder", "für", "mit", "ohne", "von", "vom", "im",
  "in", "am", "an", "auf", "aus", "bei", "bis", "zu", "zum", "zur", "so",
  "wie", "was", "wer", "dein", "deine", "mein", "meine", "ist", "sind",
  "nicht", "mehr", "alles", "über", "durch", "nach", "vor", "als", "auch",
]);

/**
 * Index (wortweise) des hervorzuhebenden Titelworts: das längste
 * inhaltstragende Wort vor einem Doppelpunkt/Gedankenstrich (dort steckt bei
 * Ratgebern das Kernthema), sonst im ganzen Titel. Deterministisch.
 */
export function pickAccentWordIndex(title: string): number {
  const words = title.split(/\s+/).filter(Boolean);
  if (words.length <= 1) return words.length ? 0 : -1;
  const headEnd = words.findIndex((w) => /[:–—]$/.test(w));
  const searchEnd = headEnd >= 0 ? headEnd + 1 : words.length;
  let best = -1;
  let bestLen = 0;
  for (let i = 0; i < searchEnd; i += 1) {
    const clean = words[i].replace(/[^\p{L}\p{N}]/gu, "");
    if (clean.length < 4) continue;
    if (STOPWORDS.has(clean.toLowerCase())) continue;
    if (clean.length > bestLen) {
      best = i;
      bestLen = clean.length;
    }
  }
  return best;
}

// --- Adaptive Titelgröße ---------------------------------------------------

export type MeasureFn = (text: string, size: number) => number;

export type FittedTitle = { size: number; lineHeight: number; lines: string[] };

function wrapAt(
  text: string,
  size: number,
  maxWidth: number,
  measure: MeasureFn,
): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const cand = line ? `${line} ${word}` : word;
    if (measure(cand, size) > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = cand;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * Findet die größte Titelgröße, bei der der Titel in `maxLines` Zeilen passt.
 * `baseSize` ist die Wunschgröße für kurze Titel; verkleinert wird in
 * 8%-Schritten bis `minSize`. Thumbnail-Regel: so groß wie irgend möglich.
 */
export function fitTitle(
  title: string,
  maxWidth: number,
  measure: MeasureFn,
  opts: { baseSize: number; minSize: number; maxLines: number },
): FittedTitle {
  let size = opts.baseSize;
  for (;;) {
    const lines = wrapAt(title, size, maxWidth, measure);
    const overlong = lines.some((l) => measure(l, size) > maxWidth);
    if ((lines.length <= opts.maxLines && !overlong) || size <= opts.minSize) {
      return { size, lineHeight: Math.round(size * 1.18), lines };
    }
    size = Math.max(opts.minSize, Math.floor(size * 0.92));
  }
}

// --- Scrim -----------------------------------------------------------------

/**
 * Grundfarbe des Scrims (Verlauf hinter dem Titel): tiefes Shade bzw. helles
 * Tint der Motivfarbe — wie das Band, aber als Verlauf eingesetzt.
 */
export function scrimColor(main: RGB, tone: CoverTone): RGB {
  if (tone === "dunkel") {
    return { r: main.r * 0.18, g: main.g * 0.18, b: main.b * 0.2 };
  }
  return {
    r: main.r * 0.12 + 0.88,
    g: main.g * 0.12 + 0.88,
    b: main.b * 0.12 + 0.88,
  };
}
