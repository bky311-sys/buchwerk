import { createClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

// Fair-use limit for the subscription: number of books unlockable per period.
export const SUBSCRIPTION_MONTHLY_LIMIT = 10;

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

  const now = Date.now();
  const active =
    !!sub &&
    (sub.status === "active" || sub.status === "trialing") &&
    !!sub.current_period_end &&
    new Date(sub.current_period_end).getTime() > now;

  if (!active || !sub) {
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

  await supabase.from("book_unlocks").insert({
    project_id: projectId,
    user_id: user.id,
    source: "subscription",
    period_start: periodStart,
  });
  return { ok: true };
}
