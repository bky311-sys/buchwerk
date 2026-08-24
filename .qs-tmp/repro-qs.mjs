// Lokale Reproduktion von runQualityReport: 1) Quellen-Check wie in
// lib/books/quality-report.ts, 2) Claude-Call mit identischem Prompt+Schema.
// Zweck: echte Fehlerursache des 400ers der Produktion finden.
import { env } from "./env.mjs";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const projectId = "aa711345-0e40-49d6-90ee-20af802badb6";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: project } = await admin
  .from("projects")
  .select("title, topic, audience, research")
  .eq("id", projectId)
  .single();
const { data: chapters } = await admin
  .from("chapters")
  .select("position, heading, content, sources")
  .eq("project_id", projectId)
  .order("position");

const written = chapters.filter((c) => c.content?.trim());
const manuskript = written
  .map((c) => `### Kapitel ${c.position}: ${c.heading}\n\n${c.content}`)
  .join("\n\n---\n\n");
const allSources = written.flatMap((c) => (Array.isArray(c.sources) ? c.sources : []));
console.log("sources:", allSources.length, "manuscript chars:", manuskript.length);

// --- 1) Quellen-Check nachstellen
const seen = new Set();
const unique = allSources.filter((s) => s.url && !seen.has(s.url) && seen.add(s.url));
const t0 = Date.now();
const results = await Promise.all(
  unique.slice(0, 25).map(async (source) => {
    const probe = async (url, method) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      try {
        const res = await fetch(url, {
          method,
          redirect: "follow",
          signal: controller.signal,
          headers: { "user-agent": "Mozilla/5.0 (compatible; BuchwerkQS/1.0)" },
        });
        return res.status;
      } finally {
        clearTimeout(timer);
      }
    };
    try {
      let status = await probe(source.url, "HEAD");
      if (status === 405 || status === 403 || status === 501) {
        status = await probe(source.url, "GET");
      }
      return { url: source.url, status };
    } catch (e) {
      return { url: source.url, error: `${e.name}: ${e.message}` };
    }
  }),
);
console.log("source check done in", Date.now() - t0, "ms");
for (const r of results) console.log(" ", r.status ?? r.error, r.url.slice(0, 80));

// --- 2) Claude-Call mit QS-Schema (identisch zur Produktion)
const QUALITY_JSON_SCHEMA = {
  type: "object",
  properties: {
    gesamt: {
      type: "object",
      properties: {
        score: { type: "integer" },
        urteil: { type: "string" },
        export_empfehlung: { enum: ["ok", "mit_einschraenkungen", "nicht_empfohlen"] },
      },
      required: ["score", "urteil", "export_empfehlung"],
      additionalProperties: false,
    },
    befunde: {
      type: "array",
      items: {
        type: "object",
        properties: {
          kapitel: { type: ["integer", "null"] },
          typ: {
            enum: ["wiederholung", "widerspruch", "fakten", "ki_floskel", "stil", "struktur", "rechtschreibung"],
          },
          schwere: { enum: ["hoch", "mittel", "niedrig"] },
          beschreibung: { type: "string" },
          zitat: { type: ["string", "null"] },
        },
        required: ["kapitel", "typ", "schwere", "beschreibung", "zitat"],
        additionalProperties: false,
      },
    },
  },
  required: ["gesamt", "befunde"],
  additionalProperties: false,
};

let prompt = readFileSync(join(root, "prompts", "qs-bericht.md"), "utf8");
const vars = {
  titel: project.title ?? project.topic,
  thema: project.topic,
  zielgruppe: project.audience ?? "allgemein interessierte Erwachsene",
  recherche: project.research?.trim() || "(kein Dossier)",
  manuskript,
};
for (const [k, v] of Object.entries(vars)) prompt = prompt.replaceAll(`{{${k}}}`, v);

const t1 = Date.now();
const res = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: {
    "x-api-key": env.ANTHROPIC_API_KEY,
    "anthropic-version": "2023-06-01",
    "content-type": "application/json",
  },
  body: JSON.stringify({
    model: "claude-sonnet-4-6",
    max_tokens: 8000,
    messages: [{ role: "user", content: prompt }],
    output_config: { format: { type: "json_schema", schema: QUALITY_JSON_SCHEMA } },
  }),
});
console.log("claude status:", res.status, "in", Date.now() - t1, "ms");
const text = await res.text();
if (!res.ok) {
  console.log("CLAUDE ERROR:", text.slice(0, 1200));
  process.exit(1);
}
const data = JSON.parse(text);
console.log("stop_reason:", data.stop_reason, "usage:", JSON.stringify(data.usage));
const out = data.content.filter((b) => b.type === "text").map((b) => b.text).join("");
const S = "/private/tmp/claude-501/-Users-benjaminkoch-Toolset/2d829ae3-88e3-4bf4-8910-90290396cecb/scratchpad/qs-durchlauf";
const { writeFileSync } = await import("node:fs");
writeFileSync(join(S, "qs-report-lokal.json"), out);
console.log("report saved, chars:", out.length);
process.exit(0);
