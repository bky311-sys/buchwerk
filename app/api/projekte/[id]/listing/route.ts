import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateListing } from "@/lib/books/listing-generate";

// Listing generation runs here, not in a Server Action, so the client can fire
// it and poll the page for the result instead of blocking on one long request
// (same pattern as chapters and the outline).
export const maxDuration = 60;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const result = await generateListing(supabase, id);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
