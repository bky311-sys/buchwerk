// Erzeugt EINE frische Session (Magic-Link via Admin-API) und schreibt sie als
// curl-Cookie-Jar (Netscape-Format). Bewusst OHNE setSession(): kein lokaler
// Refresh, der Refresh-Token bleibt unverbraucht. Der Cookie-Wert ist exakt das
// @supabase/ssr-Format: "base64-" + base64url(JSON der Session).
import { env } from "./env.mjs";
import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "node:fs";

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const ref = new URL(url).hostname.split(".")[0];
const email = "bky311+test@gmail.com";
const jarPath = process.argv[2];
if (!jarPath) {
  console.error("usage: node login.mjs <jar-path>");
  process.exit(1);
}

const admin = createClient(url, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
  type: "magiclink",
  email,
});
if (linkErr) {
  console.error("generateLink failed:", linkErr.message);
  process.exit(1);
}

const pub = createClient(url, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const { data: otpData, error: otpErr } = await pub.auth.verifyOtp({
  type: "magiclink",
  token_hash: linkData.properties.hashed_token,
});
if (otpErr || !otpData.session) {
  console.error("verifyOtp failed:", otpErr?.message);
  process.exit(1);
}

const s = otpData.session;
const sessionJson = JSON.stringify({
  access_token: s.access_token,
  refresh_token: s.refresh_token,
  user: s.user,
  token_type: s.token_type,
  expires_in: s.expires_in,
  expires_at: s.expires_at,
});
const value =
  "base64-" +
  Buffer.from(sessionJson, "utf8")
    .toString("base64")
    .replace(/=+$/, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

const name = `sb-${ref}-auth-token`;
// Chunken wie @supabase/ssr (Grenze 3180 Zeichen)
const CHUNK = 3180;
const cookies = [];
if (value.length <= CHUNK) {
  cookies.push([name, value]);
} else {
  for (let i = 0; i * CHUNK < value.length; i++) {
    cookies.push([`${name}.${i}`, value.slice(i * CHUNK, (i + 1) * CHUNK)]);
  }
}

const expiry = Math.floor(Date.now() / 1000) + 34560000;
const lines = ["# Netscape HTTP Cookie File"];
for (const [n, v] of cookies) {
  lines.push(`buchwerk.info\tFALSE\t/\tTRUE\t${expiry}\t${n}\t${v}`);
}
writeFileSync(jarPath, lines.join("\n") + "\n");
console.log(
  `jar written: ${jarPath} (${cookies.length} cookie(s), expires_at=${s.expires_at}, user=${s.user.id})`,
);
process.exit(0);
