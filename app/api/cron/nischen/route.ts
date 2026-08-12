import { NextResponse } from "next/server";
import {
  generateNichePool,
  validateNiches,
} from "@/lib/books/niche-pool";
import { collectBookMetrics } from "@/lib/books/amazon-metrics";
import { sendWeeklyBookDigest } from "@/lib/books/weekly-digest";

export const runtime = "nodejs";
export const maxDuration = 300;

// Anzahl Nischen-Validierungen pro Lauf: je ~20–40 s Web-Search-Call, vier
// Stück bleiben sicher unter maxDuration. 24er-Batch → in ~6 Tagesläufen fertig.
const VALIDATIONS_PER_RUN = 4;

/**
 * Täglicher Sammel-Cron (Vercel Hobby erlaubt nur 2 Cron-Jobs, je 1×/Tag —
 * deshalb ein Dispatcher statt mehrerer Crons):
 *
 * 1. Nischen-Pool: montags einen frischen 24er-Kandidaten-Batch recherchieren;
 *    an allen Tagen offene Kandidaten gegen echte Amazon-Zahlen validieren
 *    (LLM schlägt vor, Marktdaten entscheiden — "schwach" fliegt raus).
 * 2. Amazon-Metriken: für veröffentlichte Bücher mit amazon_url einen
 *    BSR/Bewertungs-Snapshot in book_metrics schreiben (Ground Truth, welche
 *    Nischen wirklich verkaufen).
 *
 * Auth wie beim Mail-Poll: Vercel Cron sendet `Authorization: Bearer
 * <CRON_SECRET>`; manuelle Läufe dürfen ?secret=<CRON_SECRET> übergeben.
 * Manuell erzwingen: ?generate=1 erzeugt einen Batch unabhängig vom Wochentag.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const url = new URL(request.url);
  const auth = request.headers.get("authorization");
  const provided =
    auth?.replace(/^Bearer\s+/i, "") ?? url.searchParams.get("secret");

  if (!secret || provided !== secret) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const isMonday = new Date().getUTCDay() === 1;
  const forceGenerate = url.searchParams.get("generate") === "1";

  // An Generierungs-Tagen keine Validierung (Zeitbudget: Generierung ~90 s +
  // Metriken müssen sicher unter maxDuration bleiben). Der Batch wird ab dem
  // Folgetag abgearbeitet — die UI zeigt unvalidierte Nischen solange ohne
  // Marktdaten-Badge.
  const generateNow = isMonday || forceGenerate;
  const pool = generateNow ? await generateNichePool() : { ok: true };
  const validation = generateNow
    ? { ok: true, checked: 0, discarded: 0, remaining: -1 }
    : await validateNiches(VALIDATIONS_PER_RUN);
  const metrics = await collectBookMetrics();

  // Montags zusätzlich die Wochen-Mail „Dein Buch diese Woche" (nach den
  // frischen Metriken, damit der Montags-Snapshot schon drin ist). Manuell:
  // ?digest=1. Mails sind schnelle HTTP-Posts — das Zeitbudget bleibt sicher.
  const digestNow = isMonday || url.searchParams.get("digest") === "1";
  const digest = digestNow
    ? await sendWeeklyBookDigest()
    : { ok: true, sent: 0, skipped: 0 };

  const ok = pool.ok && validation.ok && digest.ok;
  return NextResponse.json(
    { ok, pool, validation, metrics, digest },
    { status: ok ? 200 : 500 },
  );
}
