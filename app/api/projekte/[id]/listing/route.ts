import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateListing } from "@/lib/books/listing-generate";

// Listing generation runs here, not in a Server Action, so the client can fire
// it and poll the page for the result instead of blocking on one long request
// (same pattern as chapters and the outline).
export const maxDuration = 300;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as {
    preserveDescription?: boolean;
  } | null;
  const supabase = await createClient();
  const result = await generateListing(
    supabase,
    id,
    body?.preserveDescription !== false,
  );
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
