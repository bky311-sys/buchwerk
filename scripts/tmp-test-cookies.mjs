// Erzeugt die @supabase/ssr-Cookies für eine frische Testsession und gibt
// JS aus, das sie im eingebetteten Browser setzt (Fallback laut Testaufbau).
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { readFileSync, writeFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const email = process.argv[2] ?? "bky311+test@gmail.com";

const admin = createClient(url, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
  type: "magiclink",
  email,
});
if (linkErr) throw new Error("generateLink: " + linkErr.message);

const jar = new Map();
const ssrClient = createServerClient(url, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  cookies: {
    getAll: () => [...jar.entries()].map(([name, value]) => ({ name, value })),
    setAll: (cs) => cs.forEach((c) => jar.set(c.name, c.value)),
  },
});
const { error: otpErr } = await ssrClient.auth.verifyOtp({
  type: "magiclink",
  token_hash: linkData.properties.hashed_token,
});
if (otpErr) throw new Error("verifyOtp: " + otpErr.message);

const js = [...jar.entries()]
  .map(
    ([name, value]) =>
      `document.cookie=${JSON.stringify(
        `${name}=${encodeURIComponent(value)}; path=/; max-age=3600; secure; samesite=lax`,
      )};`,
  )
  .join("");
writeFileSync(process.argv[3] ?? "/tmp/bw-cookie.js", js + "'cookies gesetzt: ' + document.cookie.length");
console.log("ok, Cookies:", [...jar.keys()].join(", "));
