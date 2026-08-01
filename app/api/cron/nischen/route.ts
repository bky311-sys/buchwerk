import { NextResponse } from "next/server";
import { generateNichePool } from "@/lib/books/niche-pool";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Wöchentlicher Nischen-Pool-Lauf (Vercel Cron, siehe vercel.json): recherchiert
 * per Web-Search frische Buchnischen für die "Keine Idee?"-Vorschläge im
 * Neues-Buch-Formular.
 *
 * Auth wie beim Mail-Poll: Vercel Cron sendet `Authorization: Bearer
 * <CRON_SECRET>`; manuelle Läufe dürfen ?secret=<CRON_SECRET> übergeben.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  const provided =
    auth?.replace(/^Bearer\s+/i, "") ??
    new URL(request.url).searchParams.get("secret");

  if (!secret || provided !== secret) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const result = await generateNichePool();
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
