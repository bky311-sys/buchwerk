import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { claudeText } from "@/lib/ai/anthropic";
import { loadPrompt } from "@/lib/ai/prompts";
import { gateProduction } from "@/lib/billing/access";
import { splitChapterSources } from "@/lib/books/sources";
import { coerceBookType, chapterTypeInstructions } from "@/lib/books/book-type";
import {
  coerceQualityReport,
  type QualityFinding,
} from "@/lib/books/quality-report";
import { countWords, summarizeWrittenChapters } from "@/lib/books/generate";
import { consumeRunSlot } from "@/lib/books/run-limits";
import { chargeRun } from "@/lib/points/charge";

const DEFAULT_AUDIENCE = "allgemein interessierte Erwachsene";

// Ein Überarbeitungslauf, der länger als das hier in "läuft" hängt, gilt als
// abgebrochen (Funktion gekillt). Muss über maxDuration der Route liegen.
export const REVISION_STALE_MS = 330_000;

export type ReviseResult = {
  ok: boolean;
  error?: string;
  /** Kapitelnummern, die in diesem Aufruf überarbeitet wurden. */
  revised?: number[];
  /** true, wenn danach kein Kapitel mit Befunden mehr offen ist. */
  done?: boolean;
};

/**
 * Kapitel, für die der aktuelle Bericht Befunde meldet — in Reihenfolge.
 * Befunde ohne Kapitelnummer (buchweite Hinweise) lassen sich nicht gezielt
 * einem Kapitel zuordnen und bleiben dem Autor überlassen.
 */
export function chaptersWithFindings(
  findings: QualityFinding[],
): Map<number, QualityFinding[]> {
  const byChapter = new Map<number, QualityFinding[]>();
  const add = (position: number, finding: QualityFinding) => {
    const list = byChapter.get(position) ?? [];
    list.push(finding);
    byChapter.set(position, list);
  };

  for (const f of findings) {
    if (typeof f.kapitel === "number" && Number.isFinite(f.kapitel)) {
      add(f.kapitel, f);
      continue;
    }
    // Kapitelübergreifende Befunde (Wiederholungen über mehrere Kapitel)
    // kommen ohne Kapitelnummer — genau sie sind der Hauptmangel
    // KI-geschriebener Bücher und wurden vorher übersprungen (Messbefund
    // 28.08.: 10 von 10 Restbefunden hatten kapitel=null). Die betroffenen
    // Kapitel stehen im Klartext der Beschreibung; das ERSTE genannte behält
    // die Erklärung, alle weiteren bekommen den Auftrag zu kürzen.
    const mentioned = mentionedChapters(`${f.beschreibung} ${f.zitat ?? ""}`);
    if (mentioned.length < 2) continue;
    const [keeper, ...trimmers] = mentioned;
    for (const position of trimmers) {
      add(position, {
        ...f,
        kapitel: position,
        beschreibung: `${f.beschreibung}\n   → Auftrag für dieses Kapitel: Kapitel ${keeper} behält die vollständige Erklärung. Kürze sie hier auf das für dieses Kapitel Nötige zusammen und fülle den frei werdenden Platz NICHT wieder auf.`,
      });
    }
  }
  return new Map([...byChapter.entries()].sort((a, b) => a[0] - b[0]));
}

/**
 * Kapitelnummern aus einem Befundtext („wird in Kapitel 2, 4 und 6 erklärt"),
 * aufsteigend und ohne Dubletten.
 */
export function mentionedChapters(text: string): number[] {
  const found = new Set<number>();
  // „Kapitel 2, 4 und 6" / „Kapitel 3 und 5" / „Kapiteln 1, 2 sowie 7"
  for (const m of text.matchAll(/Kapiteln?\s+([\d\s,.und&sowiebis-]+)/gi)) {
    for (const num of m[1].matchAll(/\d+/g)) {
      const n = Number(num[0]);
      if (n >= 1 && n <= 60) found.add(n);
    }
  }
  return [...found].sort((a, b) => a - b);
}

function formatFindings(findings: QualityFinding[]): string {
  return findings
    .map((f, i) => {
      const quote = f.zitat ? `\n   Beleg: „${f.zitat}“` : "";
      return `${i + 1}. [${f.typ}, Schwere ${f.schwere}] ${f.beschreibung}${quote}`;
    })
    .join("\n");
}

/**
 * Überarbeitet die Kapitel, für die der Qualitätsbericht Befunde meldet —
 * pro Aufruf höchstens `batchSize` Kapitel, damit ein Lauf im Zeitlimit der
 * Serverless-Funktion bleibt. Der Client ruft die Route wiederholt auf, bis
 * `done` kommt (gleiches Muster wie die Recherche-Etappen).
 *
 * Bereits überarbeitete Kapitel erkennt der Lauf daran, dass sie in
 * `revised_findings_at` nach dem Berichtsdatum liegen — so ist der Aufruf
 * idempotent und ein abgebrochener Lauf setzt einfach fort.
 */
export async function reviseFromQualityReport(
  projectId: string,
  batchSize = 2,
): Promise<ReviseResult> {
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: project } = await supabase
    .from("projects")
    .select("id, title, topic, audience, published_at")
    .eq("id", projectId)
    .single();
  if (!project) return { ok: false, error: "Projekt nicht gefunden." };
  if (project.published_at) {
    return {
      ok: false,
      error:
        "Dieses Buch ist veröffentlicht und gesperrt. Für Änderungen erstelle eine Neuauflage.",
    };
  }

  const gate = await gateProduction(supabase, projectId);
  if (!gate.ok) return { ok: false, error: gate.error };

  const { data: reportRow } = await supabase
    .from("projects")
    .select("quality_report")
    .eq("id", projectId)
    .maybeSingle();
  const report = coerceQualityReport(reportRow?.quality_report ?? null);
  if (!report) {
    return {
      ok: false,
      error: "Es gibt noch keinen Qualitätsbericht — erstelle ihn zuerst.",
    };
  }

  const byChapter = chaptersWithFindings(report.befunde);
  if (byChapter.size === 0) {
    await admin
      .from("projects")
      .update({
        revision_status: "fertig",
        revision_updated_at: new Date().toISOString(),
        revision_note:
          "Keine kapitelbezogenen Befunde — es gab nichts automatisch zu beheben.",
      })
      .eq("id", projectId);
    return { ok: true, revised: [], done: true };
  }

  const { data: chapters } = await supabase
    .from("chapters")
    .select("id, position, heading, summary, content, revised_at, key_points")
    .eq("project_id", projectId)
    .order("position");
  const all = chapters ?? [];

  // Offen sind Kapitel mit Befunden, deren letzte Überarbeitung älter ist als
  // der Bericht (oder die nie überarbeitet wurden).
  const reportTime = new Date(report.erstellt_am).getTime();
  const open = [...byChapter.keys()].filter((pos) => {
    const chapter = all.find((c) => c.position === pos);
    if (!chapter?.content?.trim()) return false;
    const revised = chapter.revised_at
      ? new Date(chapter.revised_at).getTime()
      : 0;
    return revised < reportTime;
  });

  if (open.length === 0) {
    await admin
      .from("projects")
      .update({
        revision_status: "fertig",
        revision_updated_at: new Date().toISOString(),
      })
      .eq("id", projectId);
    return { ok: true, revised: [], done: true };
  }

  // Missbrauchsbremse: gezählt wird der START einer Überarbeitungsrunde.
  if (open.length === byChapter.size) {
    const charge = await chargeRun("auto_revision", projectId);
    if (!charge.allowed) return { ok: false, error: charge.error };
    const slot = await consumeRunSlot(projectId, "quality_runs");
    if (!slot.allowed) return { ok: false, error: slot.error };
  }

  await admin
    .from("projects")
    .update({
      revision_status: "läuft",
      revision_updated_at: new Date().toISOString(),
    })
    .eq("id", projectId);

  // Kontext, der für alle Kapitel gleich bleibt.
  const { data: typeRow } = await supabase
    .from("projects")
    .select("book_type")
    .eq("id", projectId)
    .maybeSingle();
  const { data: researchRow } = await supabase
    .from("projects")
    .select("research")
    .eq("id", projectId)
    .maybeSingle();

  const bookType = coerceBookType(typeRow?.book_type);
  const gliederung = all
    .map((c) => `${c.position}. ${c.heading} — ${c.summary ?? ""}`)
    .join("\n");
  const recherche =
    researchRow?.research?.trim() ||
    "(Kein Recherche-Dossier vorhanden. Ändere keine Zahlen, für die dir eine Grundlage fehlt.)";

  const revised: number[] = [];
  try {
    for (const position of open.slice(0, batchSize)) {
      const chapter = all.find((c) => c.position === position);
      if (!chapter?.content) continue;

      const prompt = await loadPrompt("kapitel-ueberarbeiten", {
        titel: project.title ?? project.topic,
        thema: project.topic,
        zielgruppe: project.audience ?? DEFAULT_AUDIENCE,
        recherche,
        gliederung,
        bisherige_kapitel: summarizeWrittenChapters(all, position),
        nummer: String(position),
        ueberschrift: chapter.heading,
        aktueller_text: chapter.content,
        befunde: formatFindings(byChapter.get(position) ?? []),
        // Untergrenze am AKTUELLEN Text, nicht am Zielumfang: Sonst zwingt
        // sie jeden Lauf, gestrichene Wiederholungen wieder aufzufüllen —
        // gemessen am Balkonkraftwerk-Test wurde das Buch dadurch länger
        // statt straffer (28.08.).
        mindestwoerter: String(Math.round(countWords(chapter.content) * 0.7)),
        buchtyp_anweisung: chapterTypeInstructions(bookType),
      });

      const raw = await claudeText({
        messages: [{ role: "user", content: prompt }],
        maxTokens: 8000,
      });
      const { body, sources, keyPoints } = splitChapterSources(raw);

      // Schutz vor Ausreißern: Eine Überarbeitung, die das Kapitel radikal
      // zusammenstreicht, wird verworfen — lieber der alte Text als ein
      // halbiertes Kapitel.
      const oldWords = countWords(chapter.content);
      const newWords = countWords(body);
      if (newWords < oldWords * 0.6 || newWords < 200) {
        continue;
      }

      const { error: saveError } = await supabase
        .from("chapters")
        .update({
          content: body,
          sources,
          revised_at: new Date().toISOString(),
          ...(keyPoints.length ? { key_points: keyPoints } : {}),
        })
        .eq("id", chapter.id);
      if (saveError) throw saveError;
      revised.push(position);
    }
  } catch (err) {
    console.error("Überarbeitung fehlgeschlagen", projectId, err);
    await admin
      .from("projects")
      .update({
        revision_status: "fehler",
        revision_updated_at: new Date().toISOString(),
      })
      .eq("id", projectId);
    return {
      ok: false,
      error: "Die Überarbeitung ist fehlgeschlagen. Versuch es noch einmal.",
    };
  }

  const remaining = open.length - revised.length;
  const done = remaining <= 0;
  await admin
    .from("projects")
    .update({
      revision_status: done ? "fertig" : "läuft",
      revision_updated_at: new Date().toISOString(),
      ...(done
        ? {
            revision_note: `${byChapter.size} Kapitel überarbeitet — erstelle den Bericht neu, um das Ergebnis zu sehen.`,
          }
        : {}),
    })
    .eq("id", projectId);

  return { ok: true, revised, done };
}
