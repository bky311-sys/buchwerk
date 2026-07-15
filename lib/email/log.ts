import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

// Records an outgoing mail so the admin can see sent mail alongside the inbox.
// Best-effort: never throws and never blocks the actual send — if the
// outbound_emails table isn't migrated yet, this just no-ops.
export async function logSentEmail(entry: {
  toEmail: string;
  subject: string;
  kind: string;
  resendId?: string | null;
}): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from("outbound_emails").insert({
      to_email: entry.toEmail,
      subject: entry.subject,
      kind: entry.kind,
      resend_id: entry.resendId ?? null,
    });
  } catch {
    // non-fatal — logging must never break sending
  }
}
