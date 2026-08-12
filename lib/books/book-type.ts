// Buchformate: klassischer Ratgeber/Sachbuch-Fließtext oder Workbook mit
// Übungselementen. Ein Ort für Typ-Koersion und die Prompt-Bausteine, damit
// Gliederung und Kapitel nie unterschiedliche Vorstellungen vom Format haben.
//
// Workbook-Syntax, die Kapiteltexte tragen dürfen (Zeilenanfang, eigene Zeile):
//   [UEBUNG] Titel        → Übungs-Überschrift (PDF: Linie + fett, EPUB: h3)
//   - [ ] Punkt           → Checklisten-Zeile mit echtem Kästchen
//   [NOTIZFELD 5]         → 5 Schreiblinien zum Eintragen (EPUB: Linienabsatz)

export type BookType = "ratgeber" | "workbook";

export function coerceBookType(raw: string | null | undefined): BookType {
  return raw === "workbook" ? "workbook" : "ratgeber";
}

export const BOOK_TYPE_LABEL: Record<BookType, string> = {
  ratgeber: "Ratgeber / Sachbuch",
  workbook: "Workbook / Arbeitsbuch",
};

/** Zusatzanweisung für den Gliederungs-Prompt ({{buchtyp_anweisung}}). */
export function outlineTypeInstructions(bookType: BookType): string {
  if (bookType !== "workbook") return "";
  return [
    "WICHTIG — Buchformat Workbook/Arbeitsbuch: Gliedere das Buch als Arbeitsprogramm.",
    "Jedes Kapitel ist eine Lektion, die kompaktes Wissen mit konkreten Übungen verbindet.",
    "Die Zusammenfassung jedes Kapitels nennt neben dem Inhalt auch, WAS die Leser darin aktiv erarbeiten (z. B. Selbsttest, Wochenplan, Checkliste).",
  ].join(" ");
}

/** Zusatzanweisung für den Kapitel-Prompt ({{buchtyp_anweisung}}). */
export function chapterTypeInstructions(bookType: BookType): string {
  if (bookType !== "workbook") return "";
  return [
    "- **Buchformat Workbook:** Dieses Kapitel ist eine Lektion zum Mitarbeiten. Baue 2 bis 4 Übungselemente ein und nutze dafür EXAKT diese Syntax, jeweils am Zeilenanfang in einer eigenen Zeile:",
    "  - `[UEBUNG] Titel der Übung` — danach 1–2 kurze Absätze mit der Anleitung.",
    "  - Checklisten als einzelne Zeilen im Format `- [ ] Punkt` (zum Abhaken im Buch).",
    "  - `[NOTIZFELD 4]` erzeugt 4 Schreiblinien im gedruckten Buch (wähle 3–8, wo die Leser etwas eintragen sollen — z. B. nach einer Reflexionsfrage).",
    "  Die Übungen müssen konkret zum Kapitelinhalt gehören (kein generisches „Denke darüber nach“), und zwischen den Übungen steht weiterhin substanzieller Fließtext.",
  ].join("\n");
}
