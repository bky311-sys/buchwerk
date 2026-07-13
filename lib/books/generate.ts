import "server-only";

import { createClient } from "@/lib/supabase/server";
import { claudeText } from "@/lib/ai/anthropic";
import { loadPrompt } from "@/lib/ai/prompts";
import { gateProduction } from "@/lib/billing/access";
import { splitChapterSources } from "@/lib/books/sources";

const DEFAULT_AUDIENCE = "allgemein interessierte Erwachsene";

export type GenerateResult = { ok: boolean; error?: string };

// A chapter "schreiben" status older than this is treated as failed: the
// serverless function was almost certainly killed (Vercel duration limit) before
// it could write the result. The UI then offers a retry instead of spinning
// forever. Keep this comfortably above a realistic generation time.
export const STALE_GENERATION_MS = 150_000;

// The book as a whole must reach at least 7000 words. We aim higher so the total
// clears the minimum with margin even if a chapter lands a little short.
export const TARGET_TOTAL_WORDS = 8500;
export const MIN_TOTAL_WORDS = 7000;
// A chapter shorter than target * this ratio triggers one "deepen" pass.
const MIN_CHAPTER_RATIO = 0.85;

// Rough word count for German markdown text (word tokens, ignoring markup).
export function countWords(text: string): number {
  return (text.match(/[\wäöüÄÖÜß]+/g) ?? []).length;
}

// Per-chapter word target so the whole book clears TARGET_TOTAL_WORDS.
function chapterWordTarget(chapterCount: number): number {
  const count = Math.max(1, chapterCount);
  return Math.ceil(TARGET_TOTAL_WORDS / count);
}

/**
 * Writes one chapter's content with Claude.
 *
 * The chapter is flipped to status "schreiben" *before* the (slow) model call
 * so the UI can show progress and poll for completion — independent of whether
 * this request's HTTP response ever reaches the browser. On success the status
 * becomes "fertig", on failure "fehler". Both are terminal states the poller
 * stops on.
 */
export async function generateChapterContent(
  chapterId: string,
): Promise<GenerateResult> {
  const supabase = await createClient();

  const { data: chapter, error: chapterError } = await supabase
    .from("chapters")
    .select("id, project_id, position, heading, summary")
    .eq("id", chapterId)
    .single();
  if (chapterError || !chapter) {
    return { ok: false, error: "Kapitel nicht gefunden." };
  }

  // Production is gated behind payment.
  const gate = await gateProduction(supabase, chapter.project_id);
  if (!gate.ok) return { ok: false, error: gate.error };

  const { data: project } = await supabase
    .from("projects")
    .select("title, topic, audience")
    .eq("id", chapter.project_id)
    .single();
  if (!project) {
    return { ok: false, error: "Projekt nicht gefunden." };
  }

  // Research dossier is best-effort: if the research migration isn't applied yet
  // this errors and we simply write the chapter without it, instead of breaking
  // chapter generation entirely.
  const { data: researchRow } = await supabase
    .from("projects")
    .select("research")
    .eq("id", chapter.project_id)
    .maybeSingle();

  // Mark as in progress. This commits immediately, so a concurrent poll (and a
  // page reload) sees the spinner even while the model call is still running.
  await supabase
    .from("chapters")
    .update({ status: "schreiben" })
    .eq("id", chapter.id);

  const { data: allChapters } = await supabase
    .from("chapters")
    .select("position, heading, summary")
    .eq("project_id", chapter.project_id)
    .order("position");

  const gliederung = (allChapters ?? [])
    .map((c) => `${c.position}. ${c.heading} — ${c.summary ?? ""}`)
    .join("\n");

  // A chapter write must ALWAYS finish inside the function limit and never abort.
  // Web research (~2–3 min) therefore runs as its own decoupled request, not
  // here. We use the dossier if one already exists, otherwise write from the
  // model's own knowledge — either way this call stays ~30 s.
  const recherche =
    researchRow?.research?.trim() ||
    "(Kein Recherche-Dossier vorhanden. Schreibe sorgfältig nach bestem Wissen und erfinde keine Zahlen oder Quellen.)";
  const wortziel = chapterWordTarget((allChapters ?? []).length);

  const commonVars = {
    titel: project.title ?? project.topic,
    thema: project.topic,
    zielgruppe: project.audience ?? DEFAULT_AUDIENCE,
    recherche,
    wortziel: String(wortziel),
  };

  try {
    const prompt = await loadPrompt("kapitel", {
      ...commonVars,
      gliederung,
      nummer: String(chapter.position),
      ueberschrift: chapter.heading,
      zusammenfassung: chapter.summary ?? "",
    });
    const firstRaw = await claudeText({
      messages: [{ role: "user", content: prompt }],
      maxTokens: 8000,
    });
    // Peel the model's used-sources block off the prose. Only the body is stored
    // as the chapter; the sources feed the grouped Quellenverzeichnis at book end.
    const { body: content, sources } = splitChapterSources(firstRaw);

    // Checkpoint the first pass immediately as "fertig". If the (optional) deepen
    // pass below times out and the function is killed, we keep this text instead
    // of losing everything and paying to regenerate both.
    await supabase
      .from("chapters")
      .update({ content, sources, status: "fertig" })
      .eq("id", chapter.id);

    // Enforce the minimum length: one deepen pass if the chapter came in short.
    // The first pass is already saved as "fertig" above, so even if this deepen
    // pass is cut off by the time limit the chapter is never left aborted.
    if (countWords(content) < wortziel * MIN_CHAPTER_RATIO) {
      const deepenPrompt = await loadPrompt("kapitel-vertiefen", {
        ...commonVars,
        ueberschrift: chapter.heading,
        aktueller_text: content,
      });
      const deepenedRaw = await claudeText({
        messages: [{ role: "user", content: deepenPrompt }],
        maxTokens: 8000,
      });
      const { body: deepened, sources: deepenedSources } =
        splitChapterSources(deepenedRaw);
      // Only replace if the deepen pass actually produced a longer chapter.
      if (countWords(deepened) > countWords(content)) {
        await supabase
          .from("chapters")
          .update({ content: deepened, sources: deepenedSources })
          .eq("id", chapter.id);
      }
    }

    return { ok: true };
  } catch {
    // Keep any previously written content; only the status signals the failure.
    await supabase
      .from("chapters")
      .update({ status: "fehler" })
      .eq("id", chapter.id);
    return {
      ok: false,
      error:
        "Das Kapitel konnte nicht generiert werden. Versuch es noch einmal.",
    };
  }
}
