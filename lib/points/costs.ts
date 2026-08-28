// Punkte-Preisliste (Freigabe Benjamin 28.08.). Eine Währung für alles:
// verdient durch Lesen + Bewerten im Buchshop, gekauft im Paket, enthalten im
// Abo. Ein Punkt entspricht ungefähr 10 Cent unserer echten KI-Kosten.
//
// GRUNDREGEL: Punkte kosten nur Läufe, die KI-Arbeit auslösen. Alles, was ein
// bezahltes Buch fertigstellt — PDF, EPUB, Cover-Download, Listing-Export,
// Veröffentlichen — ist IMMER kostenlos. Wer ein Buch freigeschaltet hat,
// kommt damit auch ohne Punkte bis Amazon; deshalb braucht es keine
// Reservierungslogik und niemand kann sich aussperren.

export type PointAction =
  | "outline"
  | "research"
  | "chapter"
  | "chapter_revise"
  | "quality_report"
  | "auto_revision"
  | "cover_set"
  | "listing"
  | "market_check";

export const POINT_COSTS: Record<PointAction, number> = {
  outline: 1,
  research: 5,
  chapter: 3,
  chapter_revise: 2,
  quality_report: 3,
  // Ganzes Buch anhand der Befunde überarbeiten (mehrere Kapitel-Läufe).
  auto_revision: 10,
  cover_set: 2,
  listing: 1,
  market_check: 2,
};

export const ACTION_LABELS: Record<PointAction, string> = {
  outline: "Gliederung",
  research: "Recherche",
  chapter: "Kapitel schreiben",
  chapter_revise: "Kapitel überarbeiten",
  quality_report: "Qualitätsbericht",
  auto_revision: "Automatische Überarbeitung",
  cover_set: "Cover-Motive",
  listing: "KDP-Listing",
  market_check: "Marktcheck",
};

// Startguthaben je Kauf-Art. Ein Standard-Buch verbraucht rund 42 Punkte —
// das Einmalpaket lässt also Luft für Nacharbeit, das Abo reicht für etwa
// drei Bücher im Monat.
export const POINTS_PER_BOOK_PURCHASE = 60;
export const POINTS_PER_SUBSCRIPTION_MONTH = 150;
export const POINTS_PER_TOPUP = 50;

// Obergrenze für erlesene Punkte pro Monat: Jeder Punkt kostet uns echtes
// Geld, deshalb ist der Lesezirkel großzügig, aber nicht unbegrenzt.
export const MONTHLY_EARN_CAP = 50;
