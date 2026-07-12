import { NextResponse } from "next/server";
import { regenerateOutline } from "@/lib/books/outline-generate";

// Outline regeneration runs here, not in a Server Action, so the client can fire
// it and poll the project status for the result instead of blocking on one long
// request.
export const maxDuration = 60;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await regenerateOutline(id);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
