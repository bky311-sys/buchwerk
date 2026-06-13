"use server";

import { revalidatePath } from "next/cache";
import { getAdminUser } from "@/lib/admin/access";
import { createAdminClient } from "@/lib/supabase/admin";

export type AdminResult = { ok: boolean; error?: string };

export async function setUserPlanAction(
  userId: string,
  plan: "free" | "paid",
): Promise<AdminResult> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "Nicht erlaubt." };
  if (plan !== "free" && plan !== "paid") {
    return { ok: false, error: "Ungültiger Plan." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("profiles")
    .update({ plan })
    .eq("id", userId);
  if (error) return { ok: false, error: "Konnte nicht gespeichert werden." };

  revalidatePath("/admin");
  return { ok: true };
}
