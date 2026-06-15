import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchNewMail } from "@/lib/email/imap";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Polls the welcome@ mailbox over IMAP and mirrors new mail into
 * public.inbound_emails. Triggered by the Vercel Cron defined in vercel.json.
 *
 * Auth: Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` when the
 * CRON_SECRET env var is set. Manual runs may pass ?secret=<CRON_SECRET>.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  const provided =
    auth?.replace(/^Bearer\s+/i, "") ??
    new URL(request.url).searchParams.get("secret");

  if (!secret || provided !== secret) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Cursor: highest UID we already stored. New fetch starts above it.
  const { data: last } = await supabase
    .from("inbound_emails")
    .select("imap_uid")
    .order("imap_uid", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();
  const sinceUid = last?.imap_uid ?? 0;

  let mails;
  try {
    mails = await fetchNewMail(sinceUid);
  } catch (error) {
    console.error("[inbound] IMAP fetch failed", error);
    return NextResponse.json(
      { ok: false, error: "IMAP-Abruf fehlgeschlagen." },
      { status: 502 },
    );
  }

  if (mails.length === 0) {
    return NextResponse.json({ ok: true, fetched: 0 });
  }

  const rows = mails.map((m) => ({
    message_id: m.messageId,
    imap_uid: m.imapUid,
    from_address: m.fromAddress,
    from_name: m.fromName,
    to_address: m.toAddress,
    subject: m.subject,
    text_body: m.textBody,
    html_body: m.htmlBody,
    received_at: m.receivedAt,
  }));

  const { error } = await supabase
    .from("inbound_emails")
    .upsert(rows, { onConflict: "message_id", ignoreDuplicates: true });

  if (error) {
    console.error("[inbound] upsert failed", error);
    return NextResponse.json(
      { ok: false, error: "Speichern fehlgeschlagen." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, fetched: rows.length });
}
