import { NextResponse } from "next/server";
import { generateChapterContent } from "@/lib/books/generate";

// Chapter generation is the longest single call in the app. It runs here (not in
// a Server Action) so the client can fire it and then poll the DB for the
// result, instead of hanging on one long request that may be dropped.
export const maxDuration = 60;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await generateChapterContent(id);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
