import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { POINT_COSTS, ACTION_LABELS, type PointAction } from "@/lib/points/costs";

// Punkte-Buchhaltung. Geschrieben wird ausschließlich über den Service-Role-
// Client: Der Punktestand darf nie über den Nutzer-Client manipulierbar sein.

export type SpendResult =
  | { allowed: true; balance: number }
  | { allowed: false; error: string; balance: number; needed: number };

export async function pointsBalance(userId: string): Promise<number> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("point_ledger")
    .select("delta")
    .eq("user_id", userId);
  return (data ?? []).reduce((sum, row) => sum + row.delta, 0);
}

/**
 * Bucht die Punkte für eine Aktion ab — VOR dem Modell-Call, denn ein
 * abgebrochener Lauf kostet uns die Tokens trotzdem (gleiche Logik wie die
 * bisherigen Lauf-Zähler).
 *
 * Kein „Reservieren" nötig: Export und Veröffentlichen kosten grundsätzlich
 * keine Punkte, ein leeres Konto kann also nie ein fertiges Buch blockieren.
 */
export async function spendPoints(
  userId: string,
  action: PointAction,
  projectId: string | null = null,
): Promise<SpendResult> {
  const cost = POINT_COSTS[action];
  const balance = await pointsBalance(userId);
  if (balance < cost) {
    return {
      allowed: false,
      balance,
      needed: cost,
      error: `Dafür brauchst du ${cost} Punkte (${ACTION_LABELS[action]}), du hast noch ${balance}. Punkte bekommst du im Abo, im Punktepaket — oder indem du im Buchshop ein Buch liest und bewertest. Dein fertiges Buch kannst du jederzeit ohne Punkte exportieren.`,
    };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("point_ledger").insert({
    user_id: userId,
    delta: -cost,
    reason: `spend_${action}`,
    project_id: projectId,
  });
  if (error) {
    // Nicht stillschweigend weiterlaufen lassen: Sonst liefe der teure Call,
    // ohne dass jemand dafür bezahlt (Lehre 26.08.).
    console.error("Punkte-Abbuchung fehlgeschlagen", userId, action, error);
    return {
      allowed: false,
      balance,
      needed: cost,
      error: "Die Punkte konnten nicht gebucht werden. Versuch es noch einmal.",
    };
  }
  return { allowed: true, balance: balance - cost };
}

/** Gutschrift (Kauf, Abo-Monat, Punktepaket, Kulanz). */
export async function creditPoints(
  userId: string,
  amount: number,
  reason: string,
): Promise<void> {
  if (amount <= 0) return;
  const admin = createAdminClient();
  const { error } = await admin
    .from("point_ledger")
    .insert({ user_id: userId, delta: amount, reason });
  if (error) console.error("Punkte-Gutschrift fehlgeschlagen", userId, reason, error);
}
