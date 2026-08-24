import { NextResponse } from "next/server";
import { generateCover } from "@/lib/books/cover-generate";
import type { CoverModel } from "@/lib/ai/replicate";

// Cover generation (Replicate) runs here, not in a Server Action, so the client
// can fire it and poll the cover list for the result instead of blocking on one
// long request.
export const maxDuration = 300;

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
  // Alle drei Modelle durchlassen — "illustration" (Ideogram) trägt die
  // Cover-2.x-Vorlagen; die alte pro/schnell-Weiche warf es still auf Flux
  // Schnell zurück.
  const model: CoverModel =
    body?.model === "pro" || body?.model === "illustration"
      ? body.model
      : "schnell";

  const result = await generateCover(id, prompt, model);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
