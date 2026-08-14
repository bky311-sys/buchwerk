// Stil-Richtungen für Cover-Motive (Cover 2.0, 14.08.). Jede Richtung bündelt
// eine Art-Direction-Anweisung für den Claude-Prompt-Vorschlag UND das
// passende Bildmodell: Flat-Illustration kann Flux nicht überzeugend —
// dafür ist Recraft V3 da; Fotorealismus bleibt bei Flux 1.1 Pro.
//
// Pure module — wird im Client (Auswahl-Chips) und Server (Actions) genutzt.

export type CoverDirectionKey =
  | "modern_flat"
  | "foto_emotion"
  | "editorial_bold"
  | "workbook_klar";

export type CoverDirection = {
  key: CoverDirectionKey;
  label: string;
  hint: string;
  /** Bildmodell für Finals dieser Richtung (lib/ai/replicate.ts). */
  model: "pro" | "illustration";
  /** Art-Direction für den Claude-Prompt-Vorschlag ({{stil_anweisung}}). */
  styleInstruction: string;
};

export const COVER_DIRECTIONS: CoverDirection[] = [
  {
    key: "modern_flat",
    label: "Modern Flat",
    hint: "Kräftige Farbfläche, ein Objekt — der Bestseller-Ratgeber-Look",
    model: "illustration",
    styleInstruction:
      "Stil-Richtung MODERN FLAT: eine moderne, hochwertige Flat-Design-Illustration. EIN zentrales, sofort erkennbares Objekt oder eine stark vereinfachte Szene auf einer großzügigen, kräftigen Farbfläche. Limitierte Palette (2–4 Farben), klare geometrische Formen, weiche Schatten, viel ruhige Fläche oben oder unten für spätere Typografie. Beschreibe explizit 'bold flat vector-style illustration, generous solid color background, minimal composition'.",
  },
  {
    key: "foto_emotion",
    label: "Foto-Emotion",
    hint: "Cineastisches Foto mit viel Negativraum",
    model: "pro",
    styleInstruction:
      "Stil-Richtung FOTO-EMOTION: eine fotorealistische, emotional aufgeladene Szene mit cineastischem Farb-Grading (bewusste Farbstimmung, sanftes Licht, geringe Tiefenschärfe). Komposition mit viel ruhigem Negativraum im oberen oder unteren Drittel für spätere Typografie. Beschreibe explizit 'cinematic color grading, shallow depth of field, calm negative space in the upper third'.",
  },
  {
    key: "editorial_bold",
    label: "Editorial Bold",
    hint: "Abstrakt-grafisch, Typo im Mittelpunkt",
    model: "illustration",
    styleInstruction:
      "Stil-Richtung EDITORIAL BOLD: ein abstrakt-grafisches Motiv als Bühne für große Typografie — z. B. eine markante Textur, geometrische Farbflächen, ein starker Farbverlauf oder ein einzelnes stark vergrößertes Detail. Kein erzählerisches Motiv, keine Szene. Mindestens zwei Drittel der Fläche ruhig und flächig. Beschreibe explizit 'bold abstract graphic composition, large calm color fields, editorial minimalism'.",
  },
  {
    key: "workbook_klar",
    label: "Workbook",
    hint: "Freundlich-praktisch mit klaren Icon-Elementen",
    model: "illustration",
    styleInstruction:
      "Stil-Richtung WORKBOOK: eine freundliche, aufgeräumte Flat-Illustration mit praktischem Charakter — wenige klare Objekte, die nach Mitmachen aussehen (z. B. Stift, Checkliste-artige Formen, Wegmarken), auf heller oder kräftiger ruhiger Farbfläche. Ordentlich, optimistisch, keine Verspieltheit. Beschreibe explizit 'clean friendly flat illustration, simple objects, tidy composition, generous solid background'.",
  },
];

export function getCoverDirection(
  key: string | null | undefined,
): CoverDirection {
  return (
    COVER_DIRECTIONS.find((d) => d.key === key) ?? COVER_DIRECTIONS[1] // Foto-Emotion = bisheriger Look
  );
}

/** Vorauswahl je Buchtyp: Workbooks starten mit der Workbook-Richtung. */
export function defaultDirectionForBookType(
  bookType: string | null | undefined,
): CoverDirectionKey {
  return bookType === "workbook" ? "workbook_klar" : "modern_flat";
}
