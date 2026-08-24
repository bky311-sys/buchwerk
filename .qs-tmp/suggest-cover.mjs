// Repliziert suggestCoverPromptAction (Server Action, per curl nicht erreichbar)
// 1:1: gleicher Prompt (prompts/cover-prompt.md), gleiche Vorlage
// (zentrum_symbol = Default für Ratgeber), gleiches Modell, gleicher
// Marktkontext. Gibt den Bild-Prompt auf stdout aus.
import { env } from "./env.mjs";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const projectId = process.argv[2];
const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const admin = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);
const { data: project } = await admin
  .from("projects")
  .select("title, topic, audience, market_snapshot")
  .eq("id", projectId)
  .single();

const snapshot = project.market_snapshot;
const competitors = (snapshot?.wettbewerber ?? [])
  .slice(0, 8)
  .map((w) => `- „${w.titel}“${w.autor ? ` (${w.autor})` : ""}`)
  .join("\n");
const marktKontext = competitors
  ? `Marktumfeld (echte Amazon-Konkurrenz dieser Nische):\n${competitors}\nWähle bewusst eine Farbwelt und Bildsprache, die sich von den bei solchen Titeln üblichen Covern ABHEBT — das Cover muss in der Amazon-Suchliste neben ihnen auffallen.`
  : "";

const styleInstruction =
  "Stil-Richtung ZENTRUM & SYMBOL: Erzeuge eine ruhige, einfarbige Pastell- oder gedeckte Farbfläche mit EINEM einzigen kleinen, liebevoll gestalteten symbolischen Objekt GENAU in der Bildmitte (das visuelle Sinnbild des Themas — konkret benennen: Material, Form, Farbe). Das Objekt nimmt höchstens ein Viertel der Fläche ein; oben und unten bleibt viel freie Fläche für Typografie. Dezenter weicher Schatten, sonst nichts. Beschreibe explizit 'one small centered symbolic object on a large calm solid pastel background, soft subtle shadow, vast empty space above and below'.";

let prompt = readFileSync(join(root, "prompts", "cover-prompt.md"), "utf8");
const vars = {
  titel: project.title ?? project.topic,
  thema: project.topic,
  zielgruppe: project.audience ?? "allgemein interessierte Erwachsene",
  stil_anweisung: styleInstruction,
  markt_kontext: marktKontext,
};
for (const [k, v] of Object.entries(vars)) {
  prompt = prompt.replaceAll(`{{${k}}}`, v);
}

const res = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: {
    "x-api-key": env.ANTHROPIC_API_KEY,
    "anthropic-version": "2023-06-01",
    "content-type": "application/json",
  },
  body: JSON.stringify({
    model: "claude-sonnet-4-6",
    max_tokens: 400,
    messages: [{ role: "user", content: prompt }],
  }),
});
if (!res.ok) {
  console.error("claude failed:", res.status, (await res.text()).slice(0, 300));
  process.exit(1);
}
const data = await res.json();
console.log(
  data.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim(),
);
process.exit(0);
