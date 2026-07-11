"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPointsBalance } from "@/lib/shop/points";
import { BOOST_COST, BOOST_DAYS } from "@/lib/shop/boost-config";

export type BoostActionResult = { ok: boolean; error?: string };

// Spends BOOST_COST points to feature the author's own published book in the
// shop for BOOST_DAYS. Requires ownership, a published book and enough points.
export async function boostBookAction(
  projectId: string,
): Promise<BoostActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Bitte melde dich an." };

  const { data: project } = await supabase
    .from("projects")
    .select("id, user_id, shop_published, shop_slug, boosted_until")
    .eq("id", projectId)
    .single();
  if (!project || project.user_id !== user.id) {
    return { ok: false, error: "Projekt nicht gefunden." };
  }
  if (!project.shop_published) {
    return {
      ok: false,
      error: "Veröffentliche das Buch zuerst im Buchshop.",
    };
  }

  const balance = await getPointsBalance(supabase, user.id);
  if (balance < BOOST_COST) {
    return {
      ok: false,
      error: `Dafür brauchst du ${BOOST_COST} Punkte — du hast ${balance}. Sammle Punkte, indem du andere Bücher bewertest.`,
    };
  }

  const admin = createAdminClient();
  // Extend from the current boost end if still active, otherwise from now.
  const now = Date.now();
  const current = project.boosted_until
    ? new Date(project.boosted_until).getTime()
    : 0;
  const from = Math.max(now, current);
  const until = new Date(from + BOOST_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { error: ledgerError } = await admin.from("point_ledger").insert({
    user_id: user.id,
    delta: -BOOST_COST,
    reason: "boost",
  });
  if (ledgerError) {
    return { ok: false, error: "Konnte die Punkte nicht einlösen." };
  }

  const { error } = await admin
    .from("projects")
    .update({ boosted_until: until })
    .eq("id", projectId);
  if (error) return { ok: false, error: "Konnte das Buch nicht boosten." };

  revalidatePath("/buchshop");
  if (project.shop_slug) revalidatePath(`/buchshop/${project.shop_slug}`);
  revalidatePath(`/projekte/${projectId}`);
  return { ok: true };
}
