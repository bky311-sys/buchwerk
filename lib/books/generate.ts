import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { claudeText } from "@/lib/ai/anthropic";
import { loadPrompt } from "@/lib/ai/prompts";
import { gateProduction } from "@/lib/billing/access";
import { splitChapterSources } from "@/lib/books/sources";
import {
  coerceBookType,
  chapterTypeInstructions,
} from "@/lib/books/book-type";
import { coerceLengthTier, LENGTH_TIERS } from "@/lib/books/length";
import { chargeRun } from "@/lib/points/charge";

const DEFAULT_AUDIENCE = "allgemein interessierte Erwachsene";

// Abuse brake, not a product limit. gateProduction spends a slot per book, not
// per generation, so regenerating a chapter is free for the user and costs us a
// Claude call every time (~5–11 ct, up to 2 calls with the deepen pass).
//
// Deliberately NOT surfaced up front: announcing "you have N tries" reads as an
// allowance and invites using it up. Nobody writing in good faith comes close to
// this number, so the honest 99% never learn the limit exists — it only speaks
// when someone hammers a single chapter.
const CHAPTER_GENERATION_LIMIT = 10;

export type GenerateResult = {
  ok: boolean;
  error?: string;
  /** Ein anderes Kapitel dieses Buchs wird gerade geschrieben (HTTP 409). */
  busy?: boolean;
};

// A chapter "schreiben" status older than this is treated as failed: the
// serverless function was almost certainly killed (Vercel duration limit) before
// it could write the result. The UI then offers a retry instead of spinning
// forever. MUSS über maxDuration der Generate-Route liegen (300 s) — sonst
// meldet die UI einen noch laufenden Lauf als „fehlgeschlagen" und lädt zum
// parallelen Zweitversuch ein.
export const STALE_GENERATION_MS = 330_000;

// A chapter shorter than target * this ratio triggers one "deepen" pass.
const MIN_CHAPTER_RATIO = 0.85;

// Ab diesem Kapitel-Wortziel wird in Abschnitts-Läufen geschrieben: ein
// einzelner Modell-Call liefert keine 2.000+ deutschen Wörter in konstanter
// Qualität (und riskiert Output-Abbruch bei maxTokens).
const SECTION_THRESHOLD = 1700;
// Zielgröße eines einzelnen Abschnitts-Laufs.
const SECTION_WORDS = 1300;

// Rough word count for German markdown text (word tokens, ignoring markup).
export function countWords(text: string): number {
  return (text.match(/[\wäöüÄÖÜß]+/g) ?? []).length;
}

// Per-chapter word target so the whole book clears the tier's target.
function chapterWordTarget(chapterCount: number, targetTotal: number): number {
  const count = Math.max(1, chapterCount);
  return Math.ceil(targetTotal / count);
}

// Unit-bearing figures a chapter already states (800 Watt, 120 bis 210 Euro …).
// Fed into the prompt so a later chapter reuses the exact value statt dieselbe
// Größe neu und leicht anders zu errechnen (QS-Durchlauf 23.08.: K1 nennt
// „120–210 Euro“ Jahresersparnis, K8 rechnet „105–241 Euro“). Längere Einheiten
// stehen in der Alternation zuerst, damit „800 Wp“ nicht als „800 W“ endet.
export function extractKeyFigures(content: string): string[] {
  const matches = content.match(
    /\d[\d.,]*(?:\s?(?:bis|und|–|-)\s?\d[\d.,]*)?\s?(?:kWh|kWp|Wp|Watt|Euro|Cent|Prozent|%|€|Jahren|Jahre|Monaten|Monate|W\b)/g,
  );
  if (!matches) return [];
  return [...new Set(matches.map((s) => s.replace(/\s+/g, " ").trim()))].slice(
    0,
    15,
  );
}

// What the already-written chapters cover, as heading + their ### subheadings
// + their key figures. This goes into the chapter prompt so the model stops
// re-explaining the same ground in every chapter — the most common flaw of
// AI-written books. Chapters were previously written fully independently (only
// the outline as context). Everything is extracted with regexes, so this costs
// no extra model call.
export function summarizeWrittenChapters(
  chapters: Array<{
    position: number;
    heading: string;
    content?: string | null;
  }>,
  excludePosition: number,
): string {
  const lines: string[] = [];
  for (const c of chapters) {
    if (c.position === excludePosition || !c.content?.trim()) continue;
    const subheads = [...c.content.matchAll(/^###\s+(.+)$/gm)]
      .map((m) => m[1].trim())
      .slice(0, 12);
    const figures = extractKeyFigures(c.content);
    lines.push(
      `Kapitel ${c.position} „${c.heading}“` +
        (subheads.length ? ` behandelt bereits: ${subheads.join("; ")}` : "") +
        (figures.length ? ` — genannte Zahlen: ${figures.join(", ")}` : ""),
    );
  }
  return lines.length
    ? lines.join("\n")
    : "(Noch keine anderen Kapitel geschrieben.)";
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

  // A published book is locked — changes must go through a new edition.
  const { data: pubRow } = await supabase
    .from("projects")
    .select("published_at")
    .eq("id", chapter.project_id)
    .maybeSingle();
  if (pubRow?.published_at) {
    return {
      ok: false,
      error:
        "Dieses Buch ist veröffentlicht und gesperrt. Für Änderungen erstelle eine Neuauflage.",
    };
  }

  // Production is gated behind payment.
  const gate = await gateProduction(supabase, chapter.project_id);
  if (!gate.ok) return { ok: false, error: gate.error };

  // Immer nur EIN Kapitel pro Buch gleichzeitig (Benjamins Fund 14.08.: Klick
  // auf ein Einzelkapitel während „Alle Kapitel schreiben" lief parallel und
  // interferierte — der Anti-Wiederholungs-Kontext sieht halbfertige
  // Geschwister, und Läufe fressen doppelt Limits). Ein festgefahrener Lauf
  // (älter als STALE_GENERATION_MS) blockiert nicht.
  const { data: siblings } = await supabase
    .from("chapters")
    .select("id, updated_at")
    .eq("project_id", chapter.project_id)
    .eq("status", "schreiben");
  const guardNow = Date.now();
  const activeSibling = (siblings ?? []).some(
    (s) =>
      s.id !== chapter.id &&
      guardNow - new Date(s.updated_at).getTime() < STALE_GENERATION_MS,
  );
  if (activeSibling) {
    return {
      ok: false,
      busy: true,
      error:
        "Gerade wird schon ein anderes Kapitel dieses Buchs geschrieben. Warte, bis es fertig ist — dann kannst du hier weitermachen.",
    };
  }

  // Abuse brake (see CHAPTER_GENERATION_LIMIT). Best-effort like the research
  // dossier below: if this migration isn't applied yet the select errors and we
  // generate without counting, instead of blocking chapter writing entirely.
  const admin = createAdminClient();
  const { data: countRow } = await admin
    .from("chapters")
    .select("generation_count")
    .eq("id", chapterId)
    .maybeSingle();
  if (countRow && countRow.generation_count >= CHAPTER_GENERATION_LIMIT) {
    return {
      ok: false,
      error:
        "Für dieses Kapitel ist das Limit an Neuversuchen erreicht. Wenn du hier wirklich nicht weiterkommst, schreib uns an welcome@buchwerk.info.",
    };
  }
  // Punkte für den Kapitel-Lauf (Punkte-Modell 28.08.) — vor dem Modell-Call,
  // denn ein abgebrochener Lauf kostet die Tokens trotzdem.
  const charge = await chargeRun("chapter", chapter.project_id);
  if (!charge.allowed) return { ok: false, error: charge.error };

  // Count the attempt BEFORE the model call. A run killed by the function time
  // limit costs us the tokens all the same, so it has to count — otherwise
  // aborting mid-generation would be an unlimited free retry.
  if (countRow) {
    await admin
      .from("chapters")
      .update({ generation_count: countRow.generation_count + 1 })
      .eq("id", chapterId);
  }

  const { data: project } = await supabase
    .from("projects")
    .select("title, topic, audience")
    .eq("id", chapter.project_id)
    .single();

  // Buchtyp best-effort in eigener Abfrage (Regel 2026-07-15) — ohne Spalte
  // schreibt das Kapitel wie ein Ratgeber, exakt das alte Verhalten.
  const { data: typeRow } = await supabase
    .from("projects")
    .select("book_type")
    .eq("id", chapter.project_id)
    .maybeSingle();
  const bookType = coerceBookType(typeRow?.book_type);

  // Umfangswahl best-effort (fehlende Spalte ⇒ kompakt = altes Verhalten).
  const { data: tierRow } = await supabase
    .from("projects")
    .select("length_tier")
    .eq("id", chapter.project_id)
    .maybeSingle();
  const lengthTier = coerceLengthTier(tierRow?.length_tier);
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
  const { error: startError } = await supabase
    .from("chapters")
    .update({ status: "schreiben", generation_step: null })
    .eq("id", chapter.id);
  if (startError) {
    // Ein scheiterndes Start-Update (z. B. fehlender Spalten-Grant nach einer
    // Migration, Prod-Befund 26.08.) hieße: Modell-Calls laufen und kein
    // Ergebnis wird je gespeichert. Lieber sofort sichtbar abbrechen.
    console.error("Kapitel-Start-Update fehlgeschlagen", startError);
    return {
      ok: false,
      error: "Das Kapitel konnte nicht gestartet werden. Versuch es noch einmal.",
    };
  }

  // content is included so the prompt can list what sibling chapters already
  // cover (anti-repetition context) — server-side only, never sent to the UI.
  const { data: allChapters } = await supabase
    .from("chapters")
    .select("position, heading, summary, content")
    .eq("project_id", chapter.project_id)
    .order("position");

  const gliederung = (allChapters ?? [])
    .map((c) => `${c.position}. ${c.heading} — ${c.summary ?? ""}`)
    .join("\n");
  const bisherigeKapitel = summarizeWrittenChapters(
    allChapters ?? [],
    chapter.position,
  );

  // A chapter write must ALWAYS finish inside the function limit and never abort.
  // Web research (~2–3 min) therefore runs as its own decoupled request, not
  // here. We use the dossier if one already exists, otherwise write from the
  // model's own knowledge — either way this call stays ~30 s.
  const recherche =
    researchRow?.research?.trim() ||
    "(Kein Recherche-Dossier vorhanden. Schreibe sorgfältig nach bestem Wissen und erfinde keine Zahlen oder Quellen.)";
  const wortziel = chapterWordTarget(
    (allChapters ?? []).length,
    LENGTH_TIERS[lengthTier].targetWords,
  );

  const commonVars = {
    titel: project.title ?? project.topic,
    thema: project.topic,
    zielgruppe: project.audience ?? DEFAULT_AUDIENCE,
    recherche,
    wortziel: String(wortziel),
    bisherige_kapitel: bisherigeKapitel,
    buchtyp_anweisung: chapterTypeInstructions(bookType),
  };

  try {
    // --- Abschnitts-Modus (Standard/Premium): lange Kapitel entstehen in
    // 2–3 aufeinander aufbauenden Läufen. Ein einzelner Call trägt keine
    // 2.000+ Wörter in konstanter Qualität; außerdem checkpointet jeder
    // Abschnitt, sodass ein Timeout nur den Rest kostet.
    if (wortziel > SECTION_THRESHOLD) {
      const sectionCount = Math.min(3, Math.max(2, Math.ceil(wortziel / SECTION_WORDS)));
      const perSection = Math.ceil(wortziel / sectionCount);
      let content = `## ${chapter.heading}`;
      const seen = new Set<string>();
      const mergedSources: { title: string; url: string }[] = [];

      for (let i = 1; i <= sectionCount; i += 1) {
        const isLast = i === sectionCount;
        // Live-Fortschritt fürs Schreib-Cockpit („Abschnitt 2/3"). Best-effort:
        // ohne Spalte scheitert nur dieses Update, nicht der Lauf.
        await supabase
          .from("chapters")
          .update({ generation_step: `Abschnitt ${i}/${sectionCount}` })
          .eq("id", chapter.id);
        const tail =
          content.length > 9000 ? `…${content.slice(-9000)}` : content;
        const prompt = await loadPrompt("kapitel-abschnitt", {
          ...commonVars,
          nummer: String(chapter.position),
          ueberschrift: chapter.heading,
          zusammenfassung: chapter.summary ?? "",
          abschnitt_nummer: String(i),
          abschnitt_gesamt: String(sectionCount),
          abschnitt_wortziel: String(perSection),
          bisheriger_verlauf:
            i === 1
              ? "Bisheriger Kapiteltext: nur die Überschrift. Beginne mit einem direkten, kapitelspezifischen Einstieg (keine allgemeine Einführung ins Buchthema)."
              : `Bisheriger Kapiteltext (setze exakt hier nahtlos fort):\n${tail}`,
          abschluss_anweisung: isLast
            ? "- Dies ist der LETZTE Abschnitt: Führe das Kapitel zu einem inhaltlichen Ende. KEIN zusammenfassender Schlussabsatz, keine Vorschau auf spätere Kapitel."
            : "- Das Kapitel geht nach diesem Abschnitt weiter: Höre an einer sinnvollen Stelle auf, ohne das Kapitel abzuschließen.",
        });
        const raw = await claudeText({
          messages: [{ role: "user", content: prompt }],
          maxTokens: 8000,
        });
        const { body, sources } = splitChapterSources(raw);
        content = `${content}\n\n${body.trim()}`;
        for (const s of sources) {
          const key = (s.url || s.title).toLowerCase();
          if (key && !seen.has(key)) {
            seen.add(key);
            mergedSources.push(s);
          }
        }
        // Checkpoint nach jedem Abschnitt — der letzte setzt "fertig".
        const { error: saveError } = await supabase
          .from("chapters")
          .update({
            content,
            sources: mergedSources,
            ...(isLast ? { status: "fertig", generation_step: null } : {}),
          })
          .eq("id", chapter.id);
        // Ein scheiterndes Speichern hieße: bezahlter Text ist verloren und
        // der Lauf meldet trotzdem Erfolg (Prod-Befund 26.08.). Sichtbar
        // abbrechen statt weitere Abschnitte ins Leere zu schreiben.
        if (saveError) throw saveError;
      }
      return { ok: true };
    }

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
    const { error: saveError } = await supabase
      .from("chapters")
      .update({ content, sources, status: "fertig" })
      .eq("id", chapter.id);
    if (saveError) throw saveError;

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
  } catch (err) {
    // Keep any previously written content; only the status signals the failure.
    // Geloggt, damit Speicher-/Rechtefehler in den Runtime-Logs auffindbar
    // sind statt spurlos zu verschwinden (Prod-Befund 26.08.).
    console.error("Kapitel-Generierung fehlgeschlagen", chapter.id, err);
    await supabase
      .from("chapters")
      .update({ status: "fehler", generation_step: null })
      .eq("id", chapter.id);
    return {
      ok: false,
      error:
        "Das Kapitel konnte nicht generiert werden. Versuch es noch einmal.",
    };
  }
}
