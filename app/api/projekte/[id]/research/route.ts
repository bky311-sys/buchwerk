import { NextResponse } from "next/server";
import {
  generateResearchStage,
  RESEARCH_TOTAL_STAGES,
} from "@/lib/books/research";

// One research stage per request so each stays under the function time limit.
export const maxDuration = 60;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as {
    stage?: unknown;
  } | null;
  const stage =
    typeof body?.stage === "number" && Number.isInteger(body.stage)
      ? body.stage
      : 0;

  const result = await generateResearchStage(id, stage);
  return NextResponse.json(
    { ...result, stage, totalStages: RESEARCH_TOTAL_STAGES },
    { status: result.ok ? 200 : 400 },
  );
}
