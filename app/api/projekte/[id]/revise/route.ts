import { NextResponse } from "next/server";
import { reviseFromQualityReport } from "@/lib/books/revise";

// Automatische Überarbeitung anhand der Berichts-Befunde. Arbeitet pro Aufruf
// nur wenige Kapitel ab (Zeitlimit) — der Client ruft wiederholt auf, bis
// `done` kommt. Gleiches Fire-und-Poll-Muster wie Recherche und Kapitel.
export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await reviseFromQualityReport(id);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
