import "server-only";

import { createClient } from "@/lib/supabase/server";
import { claudeText } from "@/lib/ai/anthropic";
import { loadPrompt } from "@/lib/ai/prompts";
import { gateProduction } from "@/lib/billing/access";

const DEFAULT_AUDIENCE = "allgemein interessierte Erwachsene";

// A research run stuck in "läuft" longer than this is treated as failed.
export const RESEARCH_STALE_MS = 180_000;

// Research is done in small stages, each its own request, so every stage stays
// well under the 60 s function limit (measured: ~20–30 s per stage). The stages
// are appended into one dossier.
const RESEARCH_STAGES = [
  {
    title: "Fakten & Zahlen",
    auftrag:
      "Recherchiere belegte Fakten, aktuelle Zahlen, Studien und Daten zum Thema. Nenne konkrete Werte mit Stand/Jahr und jeweils die Quelle.",
  },
  {
    title: "Begriffe & Irrtümer",
    auftrag:
      "Erkläre kurz die wichtigsten Fachbegriffe und benenne verbreitete Irrtümer zum Thema — jeweils mit dem, was stattdessen stimmt.",
  },
  {
    title: "Material pro Kapitel & Quellen",
    auftrag:
      "Gehe die Kapitel-Gliederung durch und notiere für jede Überschrift 2–3 Stichpunkte, welche Fakten, Beispiele oder Quellen dort hineingehören. Liste am Ende die tatsächlich genutzten Quellen (Titel — URL).",
  },
];

export const RESEARCH_TOTAL_STAGES = RESEARCH_STAGES.length;

export type ResearchResult = { ok: boolean; error?: string };

/**
 * Runs one research stage (web search) and appends it to the project's dossier.
 * Stage 0 resets the dossier and marks it "läuft"; the last stage marks it
 * "fertig". Each stage is a separate request, so none exceeds the time limit.
 */
export async function generateResearchStage(
  projectId: string,
  stageIndex: number,
): Promise<ResearchResult> {
  const stage = RESEARCH_STAGES[stageIndex];
  if (!stage) return { ok: false, error: "Ungültige Recherche-Etappe." };

  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("title, topic, audience")
    .eq("id", projectId)
    .single();
  if (!project) return { ok: false, error: "Projekt nicht gefunden." };

  const gate = await gateProduction(supabase, projectId);
  if (!gate.ok) return { ok: false, error: gate.error };

  if (stageIndex === 0) {
    await supabase
      .from("projects")
      .update({
        research: null,
        research_status: "läuft",
        research_updated_at: new Date().toISOString(),
      })
      .eq("id", projectId);
  }

  const { data: chapters } = await supabase
    .from("chapters")
    .select("position, heading, summary")
    .eq("project_id", projectId)
    .order("position");
  const gliederung = (chapters ?? [])
    .map((c) => `${c.position}. ${c.heading} — ${c.summary ?? ""}`)
    .join("\n");

  try {
    const prompt = await loadPrompt("recherche-etappe", {
      titel: project.title ?? project.topic,
      thema: project.topic,
      zielgruppe: project.audience ?? DEFAULT_AUDIENCE,
      gliederung,
      abschnitt: stage.title,
      auftrag: stage.auftrag,
    });
    const text = await claudeText({
      messages: [{ role: "user", content: prompt }],
      maxTokens: 2000,
      webSearch: { maxUses: 2 },
    });

    const chunk = `## ${stage.title}\n\n${text.trim()}`;
    const { data: current } = await supabase
      .from("projects")
      .select("research")
      .eq("id", projectId)
      .maybeSingle();
    const combined =
      stageIndex === 0 || !current?.research
        ? chunk
        : `${current.research}\n\n${chunk}`;

    const isLast = stageIndex === RESEARCH_TOTAL_STAGES - 1;
    await supabase
      .from("projects")
      .update({
        research: combined,
        research_status: isLast ? "fertig" : "läuft",
        research_updated_at: new Date().toISOString(),
      })
      .eq("id", projectId);

    return { ok: true };
  } catch {
    await supabase
      .from("projects")
      .update({
        research_status: "fehler",
        research_updated_at: new Date().toISOString(),
      })
      .eq("id", projectId);
    return {
      ok: false,
      error: "Diese Recherche-Etappe ist fehlgeschlagen.",
    };
  }
}
