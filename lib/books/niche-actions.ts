"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Zählt einen "Dieses Buch starten"-Klick auf eine Nischen-Karte. Reiner
 * Feedback-Loop (welche Vorschläge ziehen wirklich?) — bewusst fire-and-forget:
 * schlägt der Zähler fehl (z. B. Migration fehlt), startet das Projekt trotzdem.
 */
export async function trackNicheStartAction(nicheId: string): Promise<void> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return; // Feature sitzt hinter dem Login.

    const admin = createAdminClient();
    const { data: row } = await admin
      .from("niche_pool")
      .select("starts")
      .eq("id", nicheId)
      .maybeSingle();
    if (!row) return;
    await admin
      .from("niche_pool")
      .update({ starts: (row.starts ?? 0) + 1 })
      .eq("id", nicheId);
  } catch {
    // still bleiben — Tracking darf nie den Projektstart stören.
  }
}
