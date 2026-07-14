import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

// Manual test-access grants are marked with this customer id so they can be told
// apart from real Stripe subscriptions (and revoked without touching a paying
// customer's subscription).
export const MANUAL_CUSTOMER_ID = "manual";
const FAR_FUTURE = "2099-12-31T00:00:00Z";

// Grants full test access: a permanent active subscription (isSubscriber +
// gateProduction both pass). Idempotent — upserts by user_id.
export async function grantManualSubscription(userId: string): Promise<boolean> {
  const admin = createAdminClient();
  const nowIso = new Date().toISOString();
  const { error } = await admin.from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_customer_id: MANUAL_CUSTOMER_ID,
      stripe_subscription_id: "manual-grant",
      status: "active",
      current_period_start: nowIso,
      current_period_end: FAR_FUTURE,
      updated_at: nowIso,
    },
    { onConflict: "user_id" },
  );
  if (error) return false;
  await admin.from("profiles").update({ plan: "paid" }).eq("id", userId);
  return true;
}

// Revokes ONLY a manual grant — a real Stripe subscription is left untouched.
export async function revokeManualSubscription(userId: string): Promise<void> {
  const admin = createAdminClient();
  await admin
    .from("subscriptions")
    .delete()
    .eq("user_id", userId)
    .eq("stripe_customer_id", MANUAL_CUSTOMER_ID);
  await admin.from("profiles").update({ plan: "free" }).eq("id", userId);
}
