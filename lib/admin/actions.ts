"use server";

import { revalidatePath } from "next/cache";
import { getAdminUser } from "@/lib/admin/access";
import {
  grantManualSubscription,
  revokeManualSubscription,
} from "@/lib/billing/grant";

export type AdminResult = { ok: boolean; error?: string };

// "paid" now grants REAL access (a manual active subscription), not just the
// cosmetic profiles.plan label — so the admin toggle actually unlocks a tester.
export async function setUserPlanAction(
  userId: string,
  plan: "free" | "paid",
): Promise<AdminResult> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "Nicht erlaubt." };
  if (plan !== "free" && plan !== "paid") {
    return { ok: false, error: "Ungültiger Plan." };
  }

  if (plan === "paid") {
    const ok = await grantManualSubscription(userId);
    if (!ok) return { ok: false, error: "Konnte nicht freischalten." };
  } else {
    await revokeManualSubscription(userId);
  }

  revalidatePath("/admin");
  return { ok: true };
}
