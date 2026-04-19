import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendConfirmationEmail } from "@/lib/email/resend";
import { waitlistPayloadSchema } from "@/lib/waitlist/schema";

export const runtime = "nodejs";

// Minimum seconds between re-sending a confirmation email for the same address.
const RESEND_THROTTLE_SECONDS = 90;

type SuccessStatus =
  | "pending_new"
  | "pending_resent"
  | "already_confirmed"
  | "throttled";

function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

function requestOrigin(request: Request): string {
  const origin = request.headers.get("origin");
  if (origin) return origin;
  const host = request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  if (host) return `${proto}://${host}`;
  return "http://localhost:3000";
}

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

  const email = parsed.data.email.toLowerCase();
  const source = parsed.data.source;
  const userAgent = request.headers.get("user-agent")?.slice(0, 512) ?? null;
  const origin = requestOrigin(request);

  const supabase = createAdminClient();

  // Look up existing row for this email.
  const { data: existing, error: lookupError } = await supabase
    .from("waitlist")
    .select("id, confirmed_at, confirmation_sent_at")
    .eq("email", email)
    .maybeSingle();

  if (lookupError) {
    console.error("[waitlist] lookup failed", lookupError);
    return NextResponse.json(
      {
        ok: false,
        message:
          "Gerade ging etwas schief. Versuch es in einem Moment noch einmal.",
      },
      { status: 500 },
    );
  }

  // 1. Already confirmed — short-circuit, no email, no DB write.
  if (existing?.confirmed_at) {
    return respond("already_confirmed", 200);
  }

  // 2. Unconfirmed row exists and was sent recently — throttle without resend.
  if (existing?.confirmation_sent_at) {
    const sentMs = new Date(existing.confirmation_sent_at).getTime();
    const ageSec = (Date.now() - sentMs) / 1000;
    if (ageSec < RESEND_THROTTLE_SECONDS) {
      return respond("throttled", 200);
    }
  }

  // 3. New row OR stale unconfirmed row — generate fresh token and send email.
  const token = generateToken();
  const sentAt = new Date().toISOString();

  if (existing) {
    // Refresh existing unconfirmed row.
    const { error: updateError } = await supabase
      .from("waitlist")
      .update({
        confirmation_token: token,
        confirmation_sent_at: sentAt,
        source,
        user_agent: userAgent,
      })
      .eq("id", existing.id);

    if (updateError) {
      console.error("[waitlist] update failed", updateError);
      return respondError();
    }
  } else {
    // Fresh insert.
    const { error: insertError } = await supabase.from("waitlist").insert({
      email,
      source,
      user_agent: userAgent,
      confirmation_token: token,
      confirmation_sent_at: sentAt,
    });

    if (insertError) {
      // 23505 = unique_violation on email (race condition — treat as throttled).
      if (insertError.code === "23505") {
        return respond("throttled", 200);
      }
      console.error("[waitlist] insert failed", insertError);
      return respondError();
    }
  }

  // Dispatch confirmation email.
  const emailResult = await sendConfirmationEmail({ to: email, token, origin });
  if ("error" in emailResult) {
    console.error("[waitlist] email send failed", emailResult.error);
    return NextResponse.json(
      {
        ok: false,
        message:
          "Der Eintrag wurde gespeichert, aber die Bestätigungs-Mail konnte gerade nicht verschickt werden. Versuch es in ein paar Minuten noch einmal.",
      },
      { status: 502 },
    );
  }

  return respond(existing ? "pending_resent" : "pending_new", 201);
}

function respond(status: SuccessStatus, httpStatus: number) {
  const messages: Record<SuccessStatus, string> = {
    pending_new:
      "Check deine Mailbox — wir haben dir einen Bestätigungslink geschickt.",
    pending_resent:
      "Wir haben dir den Bestätigungslink nochmal geschickt. Schau in deine Mailbox.",
    already_confirmed:
      "Deine Anmeldung ist bereits bestätigt. Wir melden uns zum Start.",
    throttled:
      "Wir haben dir gerade eben einen Bestätigungslink geschickt. Bitte schau in deine Mailbox (auch im Spam-Ordner).",
  };
  return NextResponse.json(
    { ok: true, status, message: messages[status] },
    { status: httpStatus },
  );
}

function respondError() {
  return NextResponse.json(
    {
      ok: false,
      message:
        "Gerade ging etwas schief. Versuch es in einem Moment noch einmal.",
    },
    { status: 500 },
  );
}
