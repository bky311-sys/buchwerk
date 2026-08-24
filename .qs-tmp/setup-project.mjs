// Legt das QS-Testprojekt per Service-Role an (Ersatz für die Server-Action,
// dokumentiert im Report), schaltet es über das Manual-Abo frei (book_unlocks)
// und setzt Autor + Impressum (sonst verweigert der Export).
import { env } from "./env.mjs";
import { createClient } from "@supabase/supabase-js";

const USER_ID = "1a30852e-3ed8-4f6e-8f48-9892e80e32ac";
const admin = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const { data: sub, error: subErr } = await admin
  .from("subscriptions")
  .select("status, current_period_start, current_period_end, stripe_customer_id")
  .eq("user_id", USER_ID)
  .maybeSingle();
if (subErr || !sub) {
  console.error("no subscription row:", subErr?.message);
  process.exit(1);
}
console.log("subscription:", JSON.stringify(sub));

const { data: project, error: insErr } = await admin
  .from("projects")
  .insert({
    user_id: USER_ID,
    topic: "Balkonkraftwerk: Planung, Anmeldung, Ertrag — der Praxis-Ratgeber",
    audience: "Einsteiger in Deutschland",
    status: "gliederung",
    book_type: "ratgeber",
    author: "Benjamin Koch",
    imprint_name: "Benjamin Koch",
    imprint_street: "Teststraße 1",
    imprint_zip: "57368",
    imprint_city: "Lennestadt",
  })
  .select("id")
  .single();
if (insErr || !project) {
  console.error("project insert failed:", insErr?.message);
  process.exit(1);
}
console.log("project:", project.id);

const { error: unlockErr } = await admin.from("book_unlocks").insert({
  project_id: project.id,
  user_id: USER_ID,
  source: "subscription",
  period_start: sub.current_period_start,
});
if (unlockErr) {
  console.error("unlock insert failed:", unlockErr.message);
  process.exit(1);
}
console.log("unlocked via subscription slot, period_start:", sub.current_period_start);
process.exit(0);
