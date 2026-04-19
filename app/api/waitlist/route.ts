import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { waitlistPayloadSchema } from "@/lib/waitlist/schema";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: "Ungültige Anfrage." },
      { status: 400 },
    );
  }

  const parsed = waitlistPayloadSchema.safeParse(json);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json(
      {
        ok: false,
        message: firstIssue?.message ?? "Bitte prüfe deine Eingabe.",
      },
      { status: 400 },
    );
  }

  const { email, source } = parsed.data;
  const userAgent = request.headers.get("user-agent")?.slice(0, 512) ?? null;

  const supabase = await createClient();
  const { error } = await supabase.from("waitlist").insert({
    email: email.toLowerCase(),
    source,
    user_agent: userAgent,
  });

  if (error) {
    // 23505 = unique_violation on the email column.
    if (error.code === "23505") {
      return NextResponse.json(
        {
          ok: true,
          alreadyRegistered: true,
          message: "Diese Email steht schon auf der Liste. Danke dir.",
        },
        { status: 200 },
      );
    }

    console.error("[waitlist] insert failed", error);
    return NextResponse.json(
      {
        ok: false,
        message: "Gerade ging etwas schief. Versuch es in einem Moment noch einmal.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      alreadyRegistered: false,
      message: "Danke — wir melden uns, sobald Buchwerk startet.",
    },
    { status: 201 },
  );
}
