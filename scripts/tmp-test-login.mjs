// Temporärer Test-Login-Helper (siehe dokumentierter Testaufbau).
// Erzeugt eine Hash-URL, über die der Browser-Client die Session übernimmt.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.argv[2] ?? "bky311+test@gmail.com";

const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
  type: "magiclink",
  email,
});
if (linkErr) {
  console.error("generateLink failed:", linkErr.message);
  process.exit(1);
}

const anon = createClient(url, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});
const { data: sess, error: otpErr } = await anon.auth.verifyOtp({
  type: "magiclink",
  token_hash: linkData.properties.hashed_token,
});
if (otpErr) {
  console.error("verifyOtp failed:", otpErr.message);
  process.exit(1);
}

const s = sess.session;
const hash = new URLSearchParams({
  access_token: s.access_token,
  refresh_token: s.refresh_token,
  expires_at: String(s.expires_at),
  expires_in: String(s.expires_in),
  token_type: "bearer",
  type: "magiclink",
}).toString();

console.log(`https://buchwerk.info/anmelden#${hash}`);
