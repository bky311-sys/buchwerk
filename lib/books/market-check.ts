import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { claudeJson } from "@/lib/ai/anthropic";
import { loadPrompt } from "@/lib/ai/prompts";
import { gateProduction } from "@/lib/billing/access";
import { consumeRunSlot } from "@/lib/books/run-limits";

const DEFAULT_AUDIENCE = "allgemein interessierte Erwachsene";

// A market check stuck in "läuft" longer than this is treated as failed.
export const MARKET_STALE_MS = 330_000;

export type MarketCompetitor = {
  titel: string;
  autor: string | null;
  jahr: number | null;
  preis_eur: number | null;
  bewertungen: number | null;
};

export type MarketSnapshot = {
  erstellt_am: string;
  einordnung: string;
  titel_muster: string;
  wettbewerber: MarketCompetitor[];
  // Echte Amazon-Suchvorschläge (Autocomplete) zu den Kernbegriffen — das
  // tippen Käufer wirklich. Speist die Keyword-Auswahl des Listings.
  suchvorschlaege: string[];
};

const MARKET_JSON_SCHEMA = {
  type: "object",
  properties: {
    einordnung: { type: "string" },
    titel_muster: { type: "string" },
    wettbewerber: {
      type: "array",
      items: {
        type: "object",
        properties: {
          titel: { type: "string" },
          autor: { type: ["string", "null"] },
          jahr: { type: ["integer", "null"] },
          preis_eur: { type: ["number", "null"] },
          bewertungen: { type: ["integer", "null"] },
        },
        required: ["titel", "autor", "jahr", "preis_eur", "bewertungen"],
        additionalProperties: false,
      },
    },
  },
  required: ["einordnung", "titel_muster", "wettbewerber"],
  additionalProperties: false,
} as const;

type MarketRaw = Pick<
  MarketSnapshot,
  "einordnung" | "titel_muster" | "wettbewerber"
>;

export type MarketCheckResult = { ok: boolean; error?: string };

/**
 * Amazon.de autocomplete for one prefix — the unauthenticated suggestions
 * endpoint the search box itself uses. Best-effort: any failure returns [].
 */
async function fetchAmazonSuggestions(prefix: string): Promise<string[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5_000);
  try {
    const params = new URLSearchParams({
      limit: "11",
      prefix,
      alias: "stripbooks",
      "site-variant": "desktop",
      mid: "A1PA6795UKMFR9", // Marketplace-ID amazon.de
    });
    const res = await fetch(
      `https://completion.amazon.de/api/2017/suggestions?${params}`,
      {
        signal: controller.signal,
        headers: { "accept-language": "de-DE,de;q=0.9" },
      },
    );
    if (!res.ok) return [];
    const data = (await res.json()) as {
      suggestions?: Array<{ value?: string }>;
    };
    return (data.suggestions ?? [])
      .map((s) => s.value?.trim() ?? "")
      .filter(Boolean);
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

// Seed prefixes for autocomplete, derived from topic and title. Short prefixes
// (2–3 words) surface what buyers actually type around the theme.
export function buildSuggestionPrefixes(
  topic: string,
  title: string | null,
): string[] {
  const clean = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-zäöüß0-9\s-]/gi, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2);
  const topicWords = clean(topic);
  const titleWords = title ? clean(title) : [];
  const prefixes = new Set<string>();
  if (topicWords.length) prefixes.add(topicWords.slice(0, 2).join(" "));
  if (topicWords.length > 2) prefixes.add(topicWords.slice(0, 3).join(" "));
  if (titleWords.length) prefixes.add(titleWords.slice(0, 2).join(" "));
  return [...prefixes].slice(0, 3);
}

/**
 * Runs the per-project market check: one web-search Claude call (real German
 * competitor titles with year/price/ratings + a niche read) plus Amazon
 * autocomplete suggestions for the core terms. Result feeds the KDP listing
 * (keywords from real searches, price anchored to real competitor prices).
 * Fire+Poll via projects.market_status; writes via admin client only.
 */
export async function runMarketCheck(
  projectId: string,
): Promise<MarketCheckResult> {
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("id, title, topic, audience")
    .eq("id", projectId)
    .single();
  if (!project) return { ok: false, error: "Projekt nicht gefunden." };

  const gate = await gateProduction(supabase, projectId);
  if (!gate.ok) return { ok: false, error: gate.error };

  const admin = createAdminClient();

  // Stille Missbrauchsbremse (siehe lib/books/run-limits.ts).
  const slot = await consumeRunSlot(projectId, "market_runs");
  if (!slot.allowed) return { ok: false, error: slot.error };

  await admin
    .from("projects")
    .update({
      market_status: "läuft",
      market_updated_at: new Date().toISOString(),
    })
    .eq("id", projectId);

  try {
    const prompt = await loadPrompt("marktcheck", {
      titel: project.title ?? project.topic,
      thema: project.topic,
      zielgruppe: project.audience ?? DEFAULT_AUDIENCE,
    });
    const raw = (await claudeJson({
      messages: [{ role: "user", content: prompt }],
      maxTokens: 3000,
      jsonSchema: MARKET_JSON_SCHEMA as unknown as Record<string, unknown>,
      webSearch: { maxUses: 4 },
    })) as MarketRaw;

    const prefixes = buildSuggestionPrefixes(project.topic, project.title);
    const suggestionLists = await Promise.all(
      prefixes.map((p) => fetchAmazonSuggestions(p)),
    );
    const suchvorschlaege = [...new Set(suggestionLists.flat())].slice(0, 15);

    const snapshot: MarketSnapshot = {
      erstellt_am: new Date().toISOString(),
      einordnung: raw.einordnung,
      titel_muster: raw.titel_muster,
      wettbewerber: (raw.wettbewerber ?? []).slice(0, 8),
      suchvorschlaege,
    };

    await admin
      .from("projects")
      .update({
        market_snapshot: snapshot,
        market_status: "fertig",
        market_updated_at: new Date().toISOString(),
      })
      .eq("id", projectId);

    return { ok: true };
  } catch {
    await admin
      .from("projects")
      .update({
        market_status: "fehler",
        market_updated_at: new Date().toISOString(),
      })
      .eq("id", projectId);
    return { ok: false, error: "Der Marktcheck konnte nicht erstellt werden." };
  }
}

/** Validates the jsonb from projects.market_snapshot into a typed snapshot. */
export function coerceMarketSnapshot(value: unknown): MarketSnapshot | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Partial<MarketSnapshot>;
  if (typeof v.einordnung !== "string") return null;
  return {
    erstellt_am: typeof v.erstellt_am === "string" ? v.erstellt_am : "",
    einordnung: v.einordnung,
    titel_muster: typeof v.titel_muster === "string" ? v.titel_muster : "",
    wettbewerber: Array.isArray(v.wettbewerber)
      ? (v.wettbewerber as MarketCompetitor[])
      : [],
    suchvorschlaege: Array.isArray(v.suchvorschlaege)
      ? (v.suchvorschlaege as string[]).filter((s) => typeof s === "string")
      : [],
  };
}

/** Renders the snapshot as the {{marktdaten}} prompt block for the KDP listing. */
export function marketSnapshotToPrompt(snapshot: MarketSnapshot): string {
  const rows = snapshot.wettbewerber.map((w) => {
    const parts = [
      w.jahr ? String(w.jahr) : null,
      w.preis_eur !== null ? `${w.preis_eur.toFixed(2).replace(".", ",")} €` : null,
      w.bewertungen !== null
        ? `${w.bewertungen.toLocaleString("de-DE")} Bewertungen`
        : null,
    ].filter(Boolean);
    return `- „${w.titel}"${w.autor ? ` (${w.autor})` : ""}${parts.length ? ` — ${parts.join(", ")}` : ""}`;
  });
  const lines = [
    "Wettbewerber auf Amazon.de:",
    rows.length ? rows.join("\n") : "- (keine gefunden)",
    "",
    `Markt-Einordnung: ${snapshot.einordnung}`,
    snapshot.titel_muster ? `Titel-Muster der Nische: ${snapshot.titel_muster}` : "",
    snapshot.suchvorschlaege.length
      ? `Echte Amazon-Suchvorschläge (das tippen Käufer): ${snapshot.suchvorschlaege.join(", ")}`
      : "",
  ].filter(Boolean);
  return lines.join("\n");
}
