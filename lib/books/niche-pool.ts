import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { claudeJson } from "@/lib/ai/anthropic";
import { loadPrompt } from "@/lib/ai/prompts";

// Feste Interessens-Tags: Prompt und UI-Filter nutzen exakt dieselbe Liste,
// damit das Filtern nie ins Leere läuft.
export const NICHE_INTERESTS = [
  "Familie & Alltag",
  "Gesundheit & Psyche",
  "Geld & Beruf",
  "Hobby & Freizeit",
  "Tiere & Natur",
  "Ernährung & Kochen",
  "Technik & Digitales",
  "Reisen & Regionales",
] as const;

// Echte Amazon-Zahlen aus der Cron-Validierung (prompts/nischen-validierung.md).
export type NicheMarket = {
  verdict: "stark" | "ok" | "schwach";
  begruendung: string;
  marktfuehrer_bewertungen: number | null;
  juengster_titel_jahr: number | null;
  preis_spanne: string | null;
  top_titel: Array<{
    titel: string;
    jahr: number | null;
    bewertungen: number | null;
    preis_eur: number | null;
  }>;
};

export type NicheRow = {
  id: string;
  title: string;
  audience: string;
  pitch: string;
  demand: string;
  competition: string;
  interests: string[];
  book_type: string;
  topic_prompt: string;
  // null = noch nicht validiert (Cron arbeitet den Batch über die Woche ab).
  market: NicheMarket | null;
};

const NICHES_PER_BATCH = 24;

const NICHE_JSON_SCHEMA = {
  type: "object",
  properties: {
    nischen: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          audience: { type: "string" },
          pitch: { type: "string" },
          demand: { enum: ["hoch", "mittel", "niedrig"] },
          competition: { enum: ["niedrig", "mittel", "hoch"] },
          interests: { type: "array", items: { type: "string" } },
          book_type: { enum: ["ratgeber", "sachbuch", "workbook"] },
          topic_prompt: { type: "string" },
        },
        required: [
          "title",
          "audience",
          "pitch",
          "demand",
          "competition",
          "interests",
          "book_type",
          "topic_prompt",
        ],
        additionalProperties: false,
      },
    },
  },
  required: ["nischen"],
  additionalProperties: false,
} as const;

export type NichePoolResult = { ok: boolean; inserted?: number; error?: string };

// Recherchiert einen frischen Nischen-Batch und schreibt ihn in niche_pool.
// Läuft im wöchentlichen Cron — bewusst EIN teurer Lauf pro Woche statt
// Live-Recherche pro Nutzer (Kosten + Missbrauchsfläche).
export async function generateNichePool(): Promise<NichePoolResult> {
  const admin = createAdminClient();
  try {
    const prompt = await loadPrompt("nischen-pool", {
      anzahl: String(NICHES_PER_BATCH),
      interessen_liste: NICHE_INTERESTS.map((t) => `- ${t}`).join("\n"),
    });
    const raw = (await claudeJson({
      messages: [{ role: "user", content: prompt }],
      maxTokens: 8000,
      jsonSchema: NICHE_JSON_SCHEMA as unknown as Record<string, unknown>,
      // 8 statt 4: ein einziger Wochenlauf für 24 Nischen — mehr Suchtiefe pro
      // Batch kostet Cents und ist die Grundlage der ganzen Vorschlagsliste.
      webSearch: { maxUses: 8 },
    })) as { nischen: Array<Omit<NicheRow, "id" | "market">> };

    const valid = new Set<string>(NICHE_INTERESTS);
    const batch = new Date().toISOString().slice(0, 10);
    const rows = raw.nischen
      .filter((n) => n.title?.trim() && n.topic_prompt?.trim())
      .map((n) => ({
        title: n.title.trim(),
        audience: n.audience?.trim() ?? "",
        pitch: n.pitch?.trim() ?? "",
        demand: ["hoch", "mittel", "niedrig"].includes(n.demand)
          ? n.demand
          : "mittel",
        competition: ["niedrig", "mittel", "hoch"].includes(n.competition)
          ? n.competition
          : "mittel",
        interests: (n.interests ?? []).filter((t) => valid.has(t)),
        book_type: ["sachbuch", "workbook"].includes(n.book_type)
          ? n.book_type
          : "ratgeber",
        topic_prompt: n.topic_prompt.trim(),
        batch,
      }));
    if (!rows.length) {
      return { ok: false, error: "Recherche lieferte keine brauchbaren Nischen." };
    }

    // Idempotent pro Tag: ein Wiederholungslauf ersetzt den heutigen Batch.
    await admin.from("niche_pool").delete().eq("batch", batch);
    const { error } = await admin.from("niche_pool").insert(rows);
    if (error) return { ok: false, error: error.message };

    return { ok: true, inserted: rows.length };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message.slice(0, 300) : "Unbekannter Fehler",
    };
  }
}

/** Validates the jsonb from niche_pool.market into typed market data. */
function coerceNicheMarket(value: unknown): NicheMarket | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Partial<NicheMarket>;
  if (v.verdict !== "stark" && v.verdict !== "ok" && v.verdict !== "schwach") {
    return null;
  }
  return {
    verdict: v.verdict,
    begruendung: typeof v.begruendung === "string" ? v.begruendung : "",
    marktfuehrer_bewertungen:
      typeof v.marktfuehrer_bewertungen === "number"
        ? v.marktfuehrer_bewertungen
        : null,
    juengster_titel_jahr:
      typeof v.juengster_titel_jahr === "number"
        ? v.juengster_titel_jahr
        : null,
    preis_spanne: typeof v.preis_spanne === "string" ? v.preis_spanne : null,
    top_titel: Array.isArray(v.top_titel)
      ? (v.top_titel as NicheMarket["top_titel"])
      : [],
  };
}

// Der neueste Batch für die UI. Leeres Array, wenn noch nie ein Lauf lief —
// die Oberfläche blendet das Feature dann einfach aus.
export async function getLatestNiches(): Promise<NicheRow[]> {
  const admin = createAdminClient();
  const { data: latest } = await admin
    .from("niche_pool")
    .select("batch")
    .order("batch", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!latest?.batch) return [];
  const { data } = await admin
    .from("niche_pool")
    .select(
      "id, title, audience, pitch, demand, competition, interests, book_type, topic_prompt",
    )
    .eq("batch", latest.batch)
    .order("created_at");
  const rows = data ?? [];

  // Validierungsdaten in EIGENER Abfrage (Regel 2026-07-15: eine vielleicht
  // noch nicht migrierte Spalte nie in den Sammel-SELECT — fehlt die Migration,
  // liefert die UI einfach unvalidierte Nischen statt gar keine).
  const checks = new Map<
    string,
    { status: string; market: NicheMarket | null }
  >();
  try {
    const { data: checkRows, error } = await admin
      .from("niche_pool")
      .select("id, check_status, market")
      .eq("batch", latest.batch);
    if (!error) {
      for (const row of checkRows ?? []) {
        checks.set(row.id, {
          status: row.check_status,
          market: coerceNicheMarket(row.market),
        });
      }
    }
  } catch {
    // Spalten fehlen noch — alle Nischen gelten als unvalidiert.
  }

  return rows
    .filter((r) => checks.get(r.id)?.status !== "verworfen")
    .map((r) => ({ ...r, market: checks.get(r.id)?.market ?? null }));
}

const VALIDATE_JSON_SCHEMA = {
  type: "object",
  properties: {
    verdict: { enum: ["stark", "ok", "schwach"] },
    begruendung: { type: "string" },
    marktfuehrer_bewertungen: { type: ["integer", "null"] },
    juengster_titel_jahr: { type: ["integer", "null"] },
    preis_spanne: { type: ["string", "null"] },
    demand: { enum: ["hoch", "mittel", "niedrig"] },
    competition: { enum: ["niedrig", "mittel", "hoch"] },
    top_titel: {
      type: "array",
      items: {
        type: "object",
        properties: {
          titel: { type: "string" },
          jahr: { type: ["integer", "null"] },
          bewertungen: { type: ["integer", "null"] },
          preis_eur: { type: ["number", "null"] },
        },
        required: ["titel", "jahr", "bewertungen", "preis_eur"],
        additionalProperties: false,
      },
    },
  },
  required: [
    "verdict",
    "begruendung",
    "marktfuehrer_bewertungen",
    "juengster_titel_jahr",
    "preis_spanne",
    "demand",
    "competition",
    "top_titel",
  ],
  additionalProperties: false,
} as const;

export type NicheValidateResult = {
  ok: boolean;
  checked: number;
  discarded: number;
  remaining: number;
  error?: string;
};

/**
 * Validates up to `maxCount` unchecked niches of the latest batch against the
 * real Amazon market (one web-search call per niche). "schwach" niches are
 * discarded (never reach the UI); the rest carry real numbers into the cards.
 * Re-entrant: the daily cron calls this until the batch is worked off — the
 * LLM proposes, Amazon data decides.
 */
export async function validateNiches(
  maxCount: number,
): Promise<NicheValidateResult> {
  const admin = createAdminClient();
  const { data: latest } = await admin
    .from("niche_pool")
    .select("batch")
    .order("batch", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!latest?.batch) {
    return { ok: true, checked: 0, discarded: 0, remaining: 0 };
  }

  const { data: pending, error: pendingError } = await admin
    .from("niche_pool")
    .select("id, title, audience, topic_prompt, book_type")
    .eq("batch", latest.batch)
    .eq("check_status", "offen")
    .order("created_at")
    .limit(maxCount + 1);
  if (pendingError) {
    // Spalten fehlen noch (Migration) — nichts zu tun, kein Fehlerzustand.
    return { ok: true, checked: 0, discarded: 0, remaining: 0 };
  }
  const batch = (pending ?? []).slice(0, maxCount);

  let checked = 0;
  let discarded = 0;
  for (const niche of batch) {
    try {
      const prompt = await loadPrompt("nischen-validierung", {
        titel: niche.title,
        thema: niche.topic_prompt,
        zielgruppe: niche.audience,
        buchtyp: niche.book_type,
      });
      const raw = (await claudeJson({
        messages: [{ role: "user", content: prompt }],
        maxTokens: 2500,
        jsonSchema: VALIDATE_JSON_SCHEMA as unknown as Record<string, unknown>,
        webSearch: { maxUses: 3 },
      })) as NicheMarket & { demand: string; competition: string };

      const market: NicheMarket = {
        verdict: raw.verdict,
        begruendung: raw.begruendung,
        marktfuehrer_bewertungen: raw.marktfuehrer_bewertungen,
        juengster_titel_jahr: raw.juengster_titel_jahr,
        preis_spanne: raw.preis_spanne,
        top_titel: (raw.top_titel ?? []).slice(0, 5),
      };
      await admin
        .from("niche_pool")
        .update({
          market,
          demand: raw.demand,
          competition: raw.competition,
          check_status: raw.verdict === "schwach" ? "verworfen" : "fertig",
          checked_at: new Date().toISOString(),
        })
        .eq("id", niche.id);
      checked += 1;
      if (raw.verdict === "schwach") discarded += 1;
    } catch {
      // Fehlgeschlagene Prüfung nicht endlos wiederholen: als "fehler"
      // markieren; die Nische bleibt (unvalidiert) sichtbar.
      await admin
        .from("niche_pool")
        .update({ check_status: "fehler", checked_at: new Date().toISOString() })
        .eq("id", niche.id);
    }
  }

  const { count } = await admin
    .from("niche_pool")
    .select("id", { count: "exact", head: true })
    .eq("batch", latest.batch)
    .eq("check_status", "offen");

  return { ok: true, checked, discarded, remaining: count ?? 0 };
}
