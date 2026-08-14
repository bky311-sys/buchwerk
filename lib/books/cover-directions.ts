// 6 Cover-Vorlagen (Cover 2.1, 14.08.) — destilliert aus aktuellen
// Bestseller-Covern und den 2026-Trends (Typo-first, Bold Color Blocking,
// Textur/handcrafted, viel Leerraum). Eine Vorlage ist ein KOMPLETTES
// Design-System: Bild-Art-Direction + Bildmodell + Typo-Layout (Fläche,
// Ausrichtung, Ton, Position). Der Nutzer wählt eine Vorlage; Feinjustierung
// über die Look-Kacheln bleibt möglich.
//
// Pure module — Client (Vorlagen-Karten) und Server (Actions, PDF).

import type {
  CoverPosition,
  CoverTone,
  CoverSurface,
} from "@/lib/books/cover-style";
import type { CoverAlign } from "@/lib/books/cover-style";

export type CoverTemplateKey =
  | "big_type"
  | "color_block"
  | "zentrum_symbol"
  | "editorial_foto"
  | "warm_illustriert"
  | "premium_dunkel";

export type CoverTemplate = {
  key: CoverTemplateKey;
  label: string;
  hint: string;
  /** Bildmodell (lib/ai/replicate.ts). */
  model: "pro" | "illustration";
  /** Art-Direction für den Claude-Prompt-Vorschlag ({{stil_anweisung}}). */
  styleInstruction: string;
  /** Typo-Preset, das die Vorlage setzt (Feinjustierung danach frei). */
  style: {
    position: CoverPosition;
    tone: CoverTone;
    surface: CoverSurface;
    align: CoverAlign;
  };
  /** Mini-Mock für die Vorlagen-Karte (CSS, ohne Bild). */
  swatch: { bg: string; fg: string; accent: string };
};

export const COVER_TEMPLATES: CoverTemplate[] = [
  {
    key: "big_type",
    label: "Big Type",
    hint: "Der Titel IST das Cover — riesige Typo auf ruhiger Fläche",
    model: "illustration",
    styleInstruction:
      "Stil-Richtung BIG TYPE (Typografie-Cover): Erzeuge einen fast leeren, hochwertig wirkenden HINTERGRUND — eine warme, ruhige Papier- oder Leinwand-Fläche (z. B. Creme, Off-White oder eine gedeckte kräftige Farbe) mit ganz dezenter Textur und höchstens 2–3 kleinen, abstrakten Akzentformen am Rand. KEIN Objekt im Zentrum, KEINE Szene — mindestens 80 % der Fläche bleiben komplett ruhig, denn die Typografie übernimmt das Cover. Beschreibe explizit 'subtle paper texture background, almost empty, tiny abstract accent shapes near the edges, generous negative space'.",
    style: { position: "oben", tone: "hell", surface: "none", align: "links" },
    swatch: { bg: "#f4efe6", fg: "#1e1b16", accent: "#d95b2a" },
  },
  {
    key: "color_block",
    label: "Color Block",
    hint: "Zwei kräftige Kontrastflächen — maximal auffällig im Thumbnail",
    model: "illustration",
    styleInstruction:
      "Stil-Richtung COLOR BLOCK: Erzeuge einen Hintergrund aus ZWEI großen, flachen, kräftig kontrastierenden Farbflächen (z. B. Marineblau/Elektrogelb, Koralle/Waldgrün — wähle ein zum Thema passendes, mutiges Paar), geteilt durch eine klare horizontale oder leicht schräge Kante. Optional EIN kleines, flaches Symbol-Objekt an der Kante. Keine Szene, keine Details, keine Verläufe — harte, satte Flächen. Beschreibe explizit 'two large flat solid color fields, hard clean edge, bold contrasting palette, minimal single flat icon'.",
    style: { position: "oben", tone: "dunkel", surface: "none", align: "mitte" },
    swatch: { bg: "#12335c", fg: "#ffffff", accent: "#f5c518" },
  },
  {
    key: "zentrum_symbol",
    label: "Zentrum & Symbol",
    hint: "Ein Symbol auf Pastellfläche — der bewährte Psychologie-Ratgeber-Look",
    model: "illustration",
    styleInstruction:
      "Stil-Richtung ZENTRUM & SYMBOL: Erzeuge eine ruhige, einfarbige Pastell- oder gedeckte Farbfläche mit EINEM einzigen kleinen, liebevoll gestalteten symbolischen Objekt GENAU in der Bildmitte (das visuelle Sinnbild des Themas — konkret benennen: Material, Form, Farbe). Das Objekt nimmt höchstens ein Viertel der Fläche ein; oben und unten bleibt viel freie Fläche für Typografie. Dezenter weicher Schatten, sonst nichts. Beschreibe explizit 'one small centered symbolic object on a large calm solid pastel background, soft subtle shadow, vast empty space above and below'.",
    style: { position: "oben", tone: "hell", surface: "none", align: "mitte" },
    swatch: { bg: "#e8e0d3", fg: "#232019", accent: "#7a9b76" },
  },
  {
    key: "editorial_foto",
    label: "Editorial Foto",
    hint: "Cineastisches Foto mit Verlauf — emotional und hochwertig",
    model: "pro",
    styleInstruction:
      "Stil-Richtung EDITORIAL FOTO: eine fotorealistische, emotional aufgeladene Szene mit cineastischem Farb-Grading (bewusste, zum Thema passende Farbstimmung, sanftes Licht, geringe Tiefenschärfe). Komposition mit ruhigem, dunklerem oder hellerem Bereich im unteren Drittel für die Typografie. Beschreibe explizit 'cinematic color grading, shallow depth of field, editorial photography, calm area in the lower third'.",
    style: { position: "unten", tone: "dunkel", surface: "scrim", align: "links" },
    swatch: { bg: "#3d3229", fg: "#ffffff", accent: "#e0a458" },
  },
  {
    key: "warm_illustriert",
    label: "Warm illustriert",
    hint: "Handgemacht wirkende Illustration mit Textur — nahbar und warm",
    model: "illustration",
    styleInstruction:
      "Stil-Richtung WARM ILLUSTRIERT: eine warme, handgemacht wirkende Illustration mit sichtbarer Papier-/Risograph-Textur und leicht unperfekten Formen (bewusst menschlich, nicht glatt-künstlich). Eine kleine, charmante Szene oder 2–3 Objekte zum Thema, erdige oder freundliche Palette, unten ein ruhigerer Bereich. Beschreibe explizit 'warm textured illustration, riso print grain, slightly imperfect hand-drawn shapes, cozy limited palette, calmer area at the bottom'.",
    style: { position: "unten", tone: "dunkel", surface: "band", align: "links" },
    swatch: { bg: "#e9c9a8", fg: "#4a2c1a", accent: "#b5542d" },
  },
  {
    key: "premium_dunkel",
    label: "Premium dunkel",
    hint: "Dunkler Fond, feine goldene Linien — Business & Finanzen",
    model: "illustration",
    styleInstruction:
      "Stil-Richtung PREMIUM DUNKEL: ein tiefdunkler, edler Fond (Marineblau, Anthrazit oder Tannengrün) mit feinen, dünnen goldenen Linien-Ornamenten oder einem kleinen geometrischen Gold-Emblem in der Bildmitte. Sehr zurückhaltend, viel dunkle Ruhe, keine Szene. Wirkt wie ein hochwertiges Business-Buch. Beschreibe explizit 'deep dark premium background, thin elegant gold line ornaments, small centered geometric emblem, vast calm dark space'.",
    style: { position: "oben", tone: "dunkel", surface: "none", align: "mitte" },
    swatch: { bg: "#101c2c", fg: "#f2ede2", accent: "#c9a24b" },
  },
];

export function getCoverTemplate(
  key: string | null | undefined,
): CoverTemplate {
  return COVER_TEMPLATES.find((t) => t.key === key) ?? COVER_TEMPLATES[2];
}

/** Vorauswahl je Buchtyp. */
export function defaultTemplateForBookType(
  bookType: string | null | undefined,
): CoverTemplateKey {
  return bookType === "workbook" ? "color_block" : "zentrum_symbol";
}
