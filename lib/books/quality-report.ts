import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { claudeJson } from "@/lib/ai/anthropic";
import { loadPrompt } from "@/lib/ai/prompts";
import { gateProduction } from "@/lib/billing/access";
import { coerceSources, type BookSource } from "@/lib/books/sources";
import { consumeRunSlot } from "@/lib/books/run-limits";

const DEFAULT_AUDIENCE = "allgemein interessierte Erwachsene";

// A quality run stuck in "läuft" longer than this is treated as failed (the
// serverless function was killed). Must exceed the route's maxDuration (300 s).
export const QUALITY_STALE_MS = 330_000;

export type QualityFinding = {
  kapitel: number | null;
  typ: string;
  schwere: "hoch" | "mittel" | "niedrig";
  beschreibung: string;
  zitat: string | null;
};

export type QualitySourceCheck = BookSource & {
  status: "ok" | "tot" | "unsicher";
};

export type QualityReport = {
  erstellt_am: string;
  score: number;
  urteil: string;
  export_empfehlung: "ok" | "mit_einschraenkungen" | "nicht_empfohlen";
  befunde: QualityFinding[];
  quellen: QualitySourceCheck[];
};

const QUALITY_JSON_SCHEMA = {
  type: "object",
  properties: {
    gesamt: {
      type: "object",
      properties: {
        // Kein minimum/maximum: Anthropics Structured Output lehnt diese
        // Properties für integer ab — der Wertebereich wird beim Parsen
        // geklemmt (Math.min/max weiter unten).
        score: { type: "integer" },
        urteil: { type: "string" },
        export_empfehlung: {
          enum: ["ok", "mit_einschraenkungen", "nicht_empfohlen"],
        },
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
            enum: [
              "wiederholung",
              "widerspruch",
              "fakten",
              "ki_floskel",
              "stil",
              "struktur",
              "rechtschreibung",
            ],
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
} as const;

type QualityRaw = {
  gesamt: {
    score: number;
    urteil: string;
    export_empfehlung: QualityReport["export_empfehlung"];
  };
  befunde: QualityFinding[];
};

export type QualityResult = { ok: boolean; error?: string };

/**
 * Deterministic link check for the book's Quellenverzeichnis. LLMs invent URLs
 * despite every instruction not to — a dead link list at the book's end is
 * exactly the kind of flaw that shows up in Amazon reviews. HEAD first, one GET
 * retry (some hosts reject HEAD), 5 s timeout each, capped to 25 URLs.
 */
async function checkSourceUrls(
  sources: BookSource[],
): Promise<QualitySourceCheck[]> {
  const seen = new Set<string>();
  const unique = sources.filter((s) => {
    if (!s.url || seen.has(s.url)) return false;
    seen.add(s.url);
    return true;
  });

  const probe = async (url: string, method: "HEAD" | "GET") => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5_000);
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

  return Promise.all(
    unique.slice(0, 25).map(async (source): Promise<QualitySourceCheck> => {
      try {
        let status = await probe(source.url, "HEAD");
        if (status === 405 || status === 403 || status === 501) {
          status = await probe(source.url, "GET");
        }
        if (status >= 200 && status < 400) return { ...source, status: "ok" };
        if (status === 404 || status === 410) return { ...source, status: "tot" };
        // Bot walls (403/503) and odd codes: the link may work in a browser.
        return { ...source, status: "unsicher" };
      } catch {
        return { ...source, status: "tot" };
      }
    }),
  );
}

/**
 * Runs the full-manuscript quality report: one Claude pass over all chapters
 * (repetitions, contradictions, facts vs. dossier, AI patterns, style,
 * structure, spelling) plus the deterministic source-link check. Fire+Poll via
 * projects.quality_status like the research dossier. Writes exclusively through
 * the admin client — the quality_* columns have no user grants on purpose.
 */
export async function runQualityReport(
  projectId: string,
): Promise<QualityResult> {
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("id, title, topic, audience")
    .eq("id", projectId)
    .single();
  if (!project) return { ok: false, error: "Projekt nicht gefunden." };

  const gate = await gateProduction(supabase, projectId);
  if (!gate.ok) return { ok: false, error: gate.error };

  const { data: chapters } = await supabase
    .from("chapters")
    .select("position, heading, content, sources")
    .eq("project_id", projectId)
    .order("position");
  const written = (chapters ?? []).filter((c) => c.content?.trim());
  if (!written.length) {
    return { ok: false, error: "Es gibt noch keine geschriebenen Kapitel." };
  }

  const admin = createAdminClient();

  // Stille Missbrauchsbremse — der QS-Lauf liest das ganze Manuskript und ist
  // damit der teuerste Einzel-Call (siehe lib/books/run-limits.ts).
  const slot = await consumeRunSlot(projectId, "quality_runs");
  if (!slot.allowed) return { ok: false, error: slot.error };

  await admin
    .from("projects")
    .update({
      quality_status: "läuft",
      quality_updated_at: new Date().toISOString(),
    })
    .eq("id", projectId);

  const { data: researchRow } = await supabase
    .from("projects")
    .select("research")
    .eq("id", projectId)
    .maybeSingle();

  const manuskript = written
    .map((c) => `### Kapitel ${c.position}: ${c.heading}\n\n${c.content}`)
    .join("\n\n---\n\n");
  const allSources = written.flatMap((c) => coerceSources(c.sources));

  try {
    // Deterministic part first — cheap, and its result goes into the report
    // even if it finds nothing.
    const quellen = await checkSourceUrls(allSources);

    const prompt = await loadPrompt("qs-bericht", {
      titel: project.title ?? project.topic,
      thema: project.topic,
      zielgruppe: project.audience ?? DEFAULT_AUDIENCE,
      recherche:
        researchRow?.research?.trim() ||
        "(Kein Recherche-Dossier vorhanden — prüfe Fakten auf Plausibilität und Scheingenauigkeit.)",
      manuskript,
    });
    const raw = (await claudeJson({
      messages: [{ role: "user", content: prompt }],
      maxTokens: 8000,
      jsonSchema: QUALITY_JSON_SCHEMA as unknown as Record<string, unknown>,
    })) as QualityRaw;

    const order = { hoch: 0, mittel: 1, niedrig: 2 } as const;
    const report: QualityReport = {
      erstellt_am: new Date().toISOString(),
      score: Math.max(0, Math.min(100, Math.round(raw.gesamt.score))),
      urteil: raw.gesamt.urteil,
      export_empfehlung: raw.gesamt.export_empfehlung,
      befunde: [...raw.befunde].sort(
        (a, b) => order[a.schwere] - order[b.schwere],
      ),
      quellen,
    };

    await admin
      .from("projects")
      .update({
        quality_report: report,
        quality_status: "fertig",
        quality_updated_at: new Date().toISOString(),
      })
      .eq("id", projectId);

    return { ok: true };
  } catch {
    await admin
      .from("projects")
      .update({
        quality_status: "fehler",
        quality_updated_at: new Date().toISOString(),
      })
      .eq("id", projectId);
    return {
      ok: false,
      error: "Der Qualitätsbericht konnte nicht erstellt werden.",
    };
  }
}

/** Validates the jsonb from projects.quality_report into a typed report. */
export function coerceQualityReport(value: unknown): QualityReport | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Partial<QualityReport>;
  if (typeof v.score !== "number" || typeof v.urteil !== "string") return null;
  return {
    erstellt_am: typeof v.erstellt_am === "string" ? v.erstellt_am : "",
    score: v.score,
    urteil: v.urteil,
    export_empfehlung:
      v.export_empfehlung === "ok" ||
      v.export_empfehlung === "mit_einschraenkungen" ||
      v.export_empfehlung === "nicht_empfohlen"
        ? v.export_empfehlung
        : "mit_einschraenkungen",
    befunde: Array.isArray(v.befunde) ? (v.befunde as QualityFinding[]) : [],
    quellen: Array.isArray(v.quellen)
      ? (v.quellen as QualitySourceCheck[])
      : [],
  };
}
