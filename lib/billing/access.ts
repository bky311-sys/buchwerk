import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

// Fair-use limit for the subscription: number of books unlockable per period.
export const SUBSCRIPTION_MONTHLY_LIMIT = 10;

// A subscription unlocks production only once Stripe has actually charged it —
// i.e. status "active". We deliberately do NOT count "trialing".
//
// Why: a free trial (status "trialing", no completed payment yet) would let
// anyone open a throwaway account, unlock up to SUBSCRIPTION_MONTHLY_LIMIT books
// for real, and cancel before the first charge — repeatable with fresh emails.
// No Stripe trial is configured today, so this changes nothing in practice; it
// keeps the door shut if a trial is ever enabled. Turning trials into real
// access must be a deliberate change here, paired with an abuse mitigation
// (card on file, per-account trial limit). See CLAUDE.md decision log 2026-07-13.
function isPayingSubscription(
  sub: { status: string; current_period_end: string | null } | null | undefined,
): boolean {
  return (
    !!sub &&
    sub.status === "active" &&
    !!sub.current_period_end &&
    new Date(sub.current_period_end).getTime() > Date.now()
  );
}

// True if the user currently has an active (paid) subscription that has not yet
// lapsed. Used to gate subscriber-only features like the Buchshop.
export async function isSubscriber(
  supabase: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("status, current_period_end")
    .eq("user_id", userId)
    .maybeSingle();

  return isPayingSubscription(sub);
}

// True if the project already has a production unlock (purchase or subscription).
export async function isProjectUnlocked(
  supabase: SupabaseClient,
  projectId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("book_unlocks")
    .select("id")
    .eq("project_id", projectId)
    .maybeSingle();
  return Boolean(data);
}

type GateResult = { ok: boolean; error?: string };

const LOCKED_MESSAGE =
  "Dieses Buch ist noch nicht freigeschaltet. Schalte es frei, um die Produktion zu nutzen.";

// Ensures the project may use production features. If the user has an active
// subscription and the project isn't unlocked yet, consumes one monthly slot.
export async function gateProduction(
  supabase: SupabaseClient,
  projectId: string,
): Promise<GateResult> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Nicht angemeldet." };

  if (await isProjectUnlocked(supabase, projectId)) return { ok: true };

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("status, current_period_start, current_period_end")
    .eq("user_id", user.id)
    .maybeSingle();

  // Only a genuinely paying subscription unlocks production. Trialing is
  // excluded on purpose (see isPayingSubscription) so a free trial can't be
  // farmed for free manuscripts across throwaway accounts.
  if (!sub || !isPayingSubscription(sub)) {
    return { ok: false, error: LOCKED_MESSAGE };
  }

  const periodStart = sub.current_period_start;
  if (!periodStart) {
    return { ok: false, error: LOCKED_MESSAGE };
  }

  const { count } = await supabase
    .from("book_unlocks")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("source", "subscription")
    .eq("period_start", periodStart);

  if ((count ?? 0) >= SUBSCRIPTION_MONTHLY_LIMIT) {
    return {
      ok: false,
      error: `Dein Abo-Limit von ${SUBSCRIPTION_MONTHLY_LIMIT} Büchern pro Monat ist erreicht. Nächsten Monat geht es weiter — oder kauf dieses Buch einzeln frei.`,
    };
  }

  // Verify ownership before consuming a slot: the RLS (cookie) client can only
  // read the user's own projects, so a null result means the project isn't
  // theirs. This guards the admin insert below, which bypasses RLS.
  const { data: owned } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .maybeSingle();
  if (!owned) return { ok: false, error: LOCKED_MESSAGE };

  // book_unlocks has no self-insert policy (security migration); write through
  // the service-role client after the checks above.
  const admin = createAdminClient();
  await admin.from("book_unlocks").insert({
    project_id: projectId,
    user_id: user.id,
    source: "subscription",
    period_start: periodStart,
  });
  return { ok: true };
}
