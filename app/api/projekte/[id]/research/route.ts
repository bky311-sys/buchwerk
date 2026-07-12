import { NextResponse } from "next/server";
import { generateResearch } from "@/lib/books/research";

// Web-search-backed research is the longest call in the app. It runs here, not
// in a Server Action, so the client can fire it and poll research_status instead
// of blocking on one long request.
export const maxDuration = 60;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await generateResearch(id);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
