// Legt einen zweiten Testnutzer OHNE Abo an (für den Paywall-/Checkout-Test)
// plus ein Projekt mit Minimal-Gliederung. Wird nach dem Test wieder gelöscht.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const email = "bky311+test2@gmail.com";

// Nutzer anlegen (oder vorhandenen verwenden)
let userId;
const { data: created, error: createErr } = await admin.auth.admin.createUser({
  email,
  email_confirm: true,
});
if (createErr) {
  const { data: list } = await admin.auth.admin.listUsers();
  const existing = list.users.find((u) => u.email === email);
  if (!existing) throw new Error("createUser: " + createErr.message);
  userId = existing.id;
} else {
  userId = created.user.id;
}

// Projekt für den Paywall-Test anlegen (falls noch keins existiert)
const { data: prj } = await admin
  .from("projects")
  .select("id")
  .eq("user_id", userId)
  .limit(1)
  .maybeSingle();

let projectId = prj?.id;
if (!projectId) {
  const { data: ins, error: prjErr } = await admin
    .from("projects")
    .insert({
      user_id: userId,
      topic: "Paywall-Testprojekt: Gartenbewässerung im Sommer",
      title: "Der Garten trinkt mit: Clever bewässern im Sommer",
    })
    .select("id")
    .single();
  if (prjErr) throw new Error("project insert: " + prjErr.message);
  projectId = ins.id;
}

console.log("USER=" + userId);
console.log("PROJECT=" + projectId);

// Magiclink-Token für Browser-Login
const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
  type: "magiclink",
  email,
});
if (linkErr) throw new Error("generateLink: " + linkErr.message);
console.log("HASH=" + link.properties.hashed_token);
