import { NextResponse } from "next/server";
import { runQualityReport } from "@/lib/books/quality-report";

// Full-manuscript quality report. Runs here (not in a Server Action) so the
// client can fire it and poll the page for the result — same pattern as
// chapters, outline and research.
export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await runQualityReport(id);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
