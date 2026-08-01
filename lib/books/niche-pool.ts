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
          book_type: { enum: ["ratgeber", "sachbuch"] },
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
      webSearch: { maxUses: 4 },
    })) as { nischen: Omit<NicheRow, "id">[] };

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
        book_type: n.book_type === "sachbuch" ? "sachbuch" : "ratgeber",
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
  return data ?? [];
}
