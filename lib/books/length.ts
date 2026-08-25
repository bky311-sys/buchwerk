// Umfangswahl (Freigabe Benjamin 25.08.2026): Der Kunde wählt vor der
// Gliederung, wie dick sein Buch wird. Seitenzahlen beziehen sich auf das
// KDP-Taschenbuch 5,5×8,5" (~175 Wörter/Seite inkl. Front-/Backmatter,
// gemessen am Balkonkraftwerk-Testbuch: 11.400 Wörter ≙ 70 Seiten).
// Kapitel ab ~1.700 Wörtern Ziel werden in Abschnitts-Läufen geschrieben
// (lib/books/generate.ts) — ein einzelner Modell-Call trägt keine 3.000+
// Wörter in gleichbleibender Qualität.

export type LengthTier = "kompakt" | "standard" | "premium";

export const LENGTH_TIERS: Record<
  LengthTier,
  {
    label: string;
    seiten: string;
    beschreibung: string;
    targetWords: number;
    minWords: number;
    kapitelSpanne: string;
  }
> = {
  kompakt: {
    label: "Kompakt",
    seiten: "ca. 80 Seiten",
    beschreibung: "Der schnelle Ratgeber auf den Punkt — ideal für klar umrissene Themen.",
    targetWords: 13000,
    minWords: 11000,
    kapitelSpanne: "6 bis 8",
  },
  standard: {
    label: "Standard",
    seiten: "ca. 130 Seiten",
    beschreibung: "Der ausgewachsene Ratgeber mit Tiefe — passt zu den meisten Themen.",
    targetWords: 21500,
    minWords: 18500,
    kapitelSpanne: "8 bis 10",
  },
  premium: {
    label: "Premium",
    seiten: "ca. 200 Seiten",
    beschreibung: "Das umfassende Standardwerk deiner Nische — maximale Substanz.",
    targetWords: 34000,
    minWords: 29500,
    kapitelSpanne: "10 bis 12",
  },
};

export const DEFAULT_LENGTH_TIER: LengthTier = "kompakt";

export function coerceLengthTier(value: unknown): LengthTier {
  return value === "standard" || value === "premium" ? value : DEFAULT_LENGTH_TIER;
}
