import { NextResponse } from "next/server";
import { generateCover } from "@/lib/books/cover-generate";
import type { CoverModel } from "@/lib/ai/replicate";

// Cover generation (Replicate) runs here, not in a Server Action, so the client
// can fire it and poll the cover list for the result instead of blocking on one
// long request.
export const maxDuration = 60;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as {
    prompt?: unknown;
    model?: unknown;
  } | null;

  const prompt = typeof body?.prompt === "string" ? body.prompt : "";
  const model = (body?.model === "pro" ? "pro" : "schnell") as CoverModel;

  const result = await generateCover(id, prompt, model);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
