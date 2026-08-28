import "server-only";

import { createClient } from "@/lib/supabase/server";
import { spendPoints } from "@/lib/points/spend";
import type { PointAction } from "@/lib/points/costs";

export type ChargeResult = { allowed: boolean; error?: string };

/**
 * Zentrale Abrechnung eines KI-Laufs (Punkte-Modell 28.08.): ermittelt den
 * eingeloggten Nutzer und bucht die Punkte ab, BEVOR das Modell läuft — ein
 * abgebrochener Lauf kostet uns die Tokens trotzdem.
 *
 * Export, PDF/EPUB und Veröffentlichen laufen NIE hierdurch: Ein bezahltes
 * Buch muss immer fertigstellbar sein, auch mit leerem Punktekonto.
 */
export async function chargeRun(
  action: PointAction,
  projectId: string | null = null,
): Promise<ChargeResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { allowed: false, error: "Bitte melde dich an." };
  }

  const result = await spendPoints(user.id, action, projectId);
  if (!result.allowed) return { allowed: false, error: result.error };
  return { allowed: true };
}
