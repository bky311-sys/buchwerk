import "server-only";
import type { createClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

// Points awarded for one submitted, buchwerk-internal review (Modell A).
//
// Credited on submission, independent of the star rating AND independent of the
// reviewed author's moderation — the author must never gate the reviewer's
// payout. Points are a purely internal instrument: never money, never buyable,
// never redeemable for cash or subscription discount, and never tied to a review
// on Amazon. See docs/BUCHSHOP.md and docs/LESEN-UND-BEWERTEN.md.
export const POINTS_PER_REVIEW = 20;

// Current internal point balance for a user (sum of ledger deltas).
export async function getPointsBalance(
  supabase: SupabaseClient,
  userId: string,
): Promise<number> {
  const { data } = await supabase
    .from("point_ledger")
    .select("delta")
    .eq("user_id", userId);

  return (data ?? []).reduce((sum, row) => sum + row.delta, 0);
}
