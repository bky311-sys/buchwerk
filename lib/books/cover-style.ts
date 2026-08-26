// Front-cover title band: two independent axes — position (top/bottom) and tone
// (light/dark). The band colour is derived from the cover motif's dominant
// colour (a dark or light shade of it), not pure black/white, so it harmonises
// with the image. Shared by the picker (client), the live preview (client) and
// the cover PDF (server). Pure module — no server-only imports.

export type CoverPosition = "oben" | "unten";
export type CoverTone = "hell" | "dunkel";
// Dritte Achse seit Cover 2.0 (14.08.): "band" = deckende Farbfläche (bisheriger
// Look), "scrim" = weicher Verlauf über dem Motiv, "none" = Typo direkt aufs
// Motiv (Cover 2.1 — die Vorlagen-Motive liefern selbst eine ruhige Fläche,
// z. B. Big Type / Color Block / Zentrum & Symbol).
export type CoverSurface = "band" | "scrim" | "none";
// Vierte Achse (Cover 2.1): Textausrichtung — zentrierte Layouts sind der
// Standard bei Symbol-/Premium-Covern, linksbündig bei Foto/Band.
export type CoverAlign = "links" | "mitte";
// Achsen 5–7 (Cover 3.0, 26.08.): Der Kunde bestimmt Schriftgröße, Schriftart
// und Titelfarbe selbst — vorher war alles automatisch aus dem Motiv
// abgeleitet und nicht justierbar (Benjamins Auftrag: „Schrift vergrößern,
// zentrieren, Farbe und Stil anpassen").
export type CoverSize = "s" | "m" | "l" | "xl";
export type CoverFont = "serif" | "grotesk";
export type CoverColor = "auto" | "weiss" | "schwarz" | "akzent";

export const DEFAULT_COVER_STYLE = "unten-dunkel-band-links-m-serif-auto";

// Skalierungsfaktoren für die Titelgröße (1 = bisheriges Verhalten).
export const COVER_SIZE_FACTORS: Record<CoverSize, number> = {
  s: 0.78,
  m: 1,
  l: 1.22,
  xl: 1.5,
};

export const COVER_SIZES: { value: CoverSize; label: string }[] = [
  { value: "s", label: "S" },
  { value: "m", label: "M" },
  { value: "l", label: "L" },
  { value: "xl", label: "XL" },
];

export const COVER_FONTS: { value: CoverFont; label: string; hint: string }[] = [
  { value: "serif", label: "Serif", hint: "klassisch, ruhig" },
  { value: "grotesk", label: "Grotesk", hint: "modern, kräftig" },
];

export const COVER_COLORS: { value: CoverColor; label: string }[] = [
  { value: "auto", label: "Automatisch" },
  { value: "weiss", label: "Weiß" },
  { value: "schwarz", label: "Schwarz" },
  { value: "akzent", label: "Akzentfarbe" },
];

export const COVER_POSITIONS: { value: CoverPosition; label: string }[] = [
  { value: "oben", label: "Oben" },
  { value: "unten", label: "Unten" },
];

export const COVER_TONES: { value: CoverTone; label: string }[] = [
  { value: "hell", label: "Hell" },
  { value: "dunkel", label: "Dunkel" },
];

export const COVER_SURFACES: { value: CoverSurface; label: string }[] = [
  { value: "band", label: "Farbband" },
  { value: "scrim", label: "Verlauf" },
];

// Parse the stored cover_title_style into its axes. Backward-compatible with
// the earlier single-word values (klassisch/kopf/hell), the two-axis form
// ("unten-dunkel" → band/links) and the three-axis form.
export type ParsedCoverStyle = {
  position: CoverPosition;
  tone: CoverTone;
  surface: CoverSurface;
  align: CoverAlign;
  size: CoverSize;
  font: CoverFont;
  color: CoverColor;
};

export function parseCoverStyle(value: string | null | undefined): ParsedCoverStyle {
  const defaults = { size: "m", font: "serif", color: "auto" } as const;
  if (value === "klassisch")
    return { position: "unten", tone: "dunkel", surface: "band", align: "links", ...defaults };
  if (value === "kopf")
    return { position: "oben", tone: "dunkel", surface: "band", align: "links", ...defaults };
  if (value === "hell")
    return { position: "unten", tone: "hell", surface: "band", align: "links", ...defaults };
  const [p, t, s, a, sz, f, c] = String(value ?? "").split("-");
  return {
    position: p === "oben" ? "oben" : "unten",
    tone: t === "hell" ? "hell" : "dunkel",
    surface: s === "scrim" ? "scrim" : s === "none" ? "none" : "band",
    align: a === "mitte" ? "mitte" : "links",
    size: sz === "s" || sz === "l" || sz === "xl" ? sz : "m",
    font: f === "grotesk" ? "grotesk" : "serif",
    color:
      c === "weiss" || c === "schwarz" || c === "akzent" ? c : "auto",
  };
}

export function buildCoverStyle(
  position: CoverPosition,
  tone: CoverTone,
  surface: CoverSurface = "band",
  align: CoverAlign = "links",
  size: CoverSize = "m",
  font: CoverFont = "serif",
  color: CoverColor = "auto",
): string {
  return `${position}-${tone}-${surface}-${align}-${size}-${font}-${color}`;
}

// Titelfarbe nach Nutzerwahl; "auto" behält die bisherige Ton-Logik.
export function resolveTitleColor(
  color: CoverColor,
  tone: CoverTone,
  accent: RGB,
): RGB {
  if (color === "weiss") return { r: 1, g: 1, b: 1 };
  if (color === "schwarz") return { r: 0.09, g: 0.08, b: 0.07 };
  if (color === "akzent") return accent;
  return bandTitleColor(tone);
}

// Normalises any stored/legacy value into "<position>-<tone>-<surface>-<align>".
export function normalizeCoverTitleStyle(
  value: string | null | undefined,
): string {
  const { position, tone, surface, align, size, font, color } =
    parseCoverStyle(value);
  return buildCoverStyle(position, tone, surface, align, size, font, color);
}

export type RGB = { r: number; g: number; b: number };

// A neutral fallback (warm paper) when the motif's colour can't be read.
export const NEUTRAL_MAIN: RGB = { r: 0.55, g: 0.5, b: 0.42 };

// Derive the band colour from the motif's dominant colour: a deep shade of it
// for the dark tone, a pale tint of it for the light tone. Keeps the hue so the
// band reads as "belonging" to the cover.
export function bandColorFromMain(main: RGB, tone: CoverTone): RGB {
  if (tone === "dunkel") {
    return {
      r: main.r * 0.24 + 0.03,
      g: main.g * 0.24 + 0.03,
      b: main.b * 0.24 + 0.04,
    };
  }
  return {
    r: main.r * 0.18 + 0.82,
    g: main.g * 0.18 + 0.82,
    b: main.b * 0.18 + 0.83,
  };
}

// Text colours that sit legibly on the band for each tone.
export function bandTitleColor(tone: CoverTone): RGB {
  return tone === "dunkel"
    ? { r: 1, g: 1, b: 1 }
    : { r: 0.12, g: 0.12, b: 0.13 };
}
export function bandAuthorColor(tone: CoverTone): RGB {
  return tone === "dunkel"
    ? { r: 0.85, g: 0.85, b: 0.88 }
    : { r: 0.34, g: 0.34, b: 0.36 };
}

// CSS helper for the browser preview.
export function rgbCss({ r, g, b }: RGB): string {
  const to = (v: number) => Math.max(0, Math.min(255, Math.round(v * 255)));
  return `rgb(${to(r)}, ${to(g)}, ${to(b)})`;
}
