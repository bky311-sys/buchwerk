import "server-only";
import type { createClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

// Points awarded for one approved, buchwerk-internal review (Modell A).
// Points are a purely internal instrument — never money, never redeemable for
// cash or subscription discount. See docs/BUCHSHOP.md.
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
