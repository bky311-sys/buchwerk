import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

// Silent abuse brakes for every paid-API endpoint, in the spirit of
// CHAPTER_GENERATION_LIMIT (see lib/books/generate.ts): gateProduction spends a
// slot per BOOK, not per generation, so without these counters regenerating
// outline/research/listing/cover/etc. was unlimited — the open item from the
// decision log 2026-07-15. Deliberately not announced in the UI: an announced
// number reads as an allowance. Honest users never get close.
//
// Counted BEFORE the model call (a killed run costs tokens all the same) and
// best-effort: if the migration is missing, the select errors and we generate
// without counting instead of blocking the feature.

export type RunColumn =
  | "outline_runs"
  | "research_runs"
  | "listing_runs"
  | "cover_runs"
  | "quality_runs"
  | "market_runs";

export const RUN_LIMITS: Record<RunColumn, number> = {
  outline_runs: 8, // komplette Neu-Gliederungen (löscht Kapitel — niemand Ehrliches macht das oft)
  research_runs: 5, // Recherche-Neustarts (3 Web-Search-Etappen pro Lauf)
  listing_runs: 10, // Listing-Neugenerierungen
  cover_runs: 40, // Flux-Bilder kosten echtes Geld pro Klick (Motiv-Iteration braucht Luft)
  quality_runs: 8, // QS liest das ganze Manuskript (teuerster Einzel-Call)
  market_runs: 5, // Marktcheck (Web-Search)
};

const LIMIT_MESSAGE =
  "Für dieses Buch ist das Limit an Neuversuchen für diesen Schritt erreicht. Wenn du hier wirklich nicht weiterkommst, schreib uns an welcome@buchwerk.info.";

export type RunSlotResult = { allowed: boolean; error?: string };

/**
 * Checks and consumes one run slot for a project. Returns allowed=false with a
 * user-facing message once the limit is reached.
 */
export async function consumeRunSlot(
  projectId: string,
  column: RunColumn,
): Promise<RunSlotResult> {
  const admin = createAdminClient();
  const { data: row } = await admin
    .from("projects")
    .select(column)
    .eq("id", projectId)
    .maybeSingle();
  // Migration fehlt oder Projekt weg → nicht blockieren.
  if (!row) return { allowed: true };

  const current = (row as Record<string, unknown>)[column];
  if (typeof current !== "number") return { allowed: true };

  if (current >= RUN_LIMITS[column]) {
    return { allowed: false, error: LIMIT_MESSAGE };
  }
  const update: Partial<Record<RunColumn, number>> = { [column]: current + 1 };
  await admin.from("projects").update(update).eq("id", projectId);
  return { allowed: true };
}
