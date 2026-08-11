import { NextResponse } from "next/server";
import { runMarketCheck } from "@/lib/books/market-check";

// Per-project market check (real Amazon competitors + autocomplete keywords).
// Fire+Poll like chapters/outline/research/QS.
export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await runMarketCheck(id);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
