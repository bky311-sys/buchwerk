import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Mails — Admin · Buchwerk",
};

const SENT_KIND_LABEL: Record<string, string> = {
  waitlist_confirmation: "Warteliste-Bestätigung",
  access_invite: "Testzugang-Einladung",
  withdrawal_receipt: "Widerruf-Bestätigung",
  withdrawal_notice: "Widerruf-Hinweis (intern)",
};

export const dynamic = "force-dynamic";

const dateFormat = new Intl.DateTimeFormat("de-DE", {
  dateStyle: "medium",
  timeStyle: "short",
});

function fmt(iso: string | null): string {
  return iso ? dateFormat.format(new Date(iso)) : "—";
}

function snippet(text: string | null, max = 140): string {
  if (!text) return "";
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max)}…` : clean;
}

export default async function AdminPosteingangPage() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("inbound_emails")
    .select(
      "id, from_name, from_address, subject, text_body, received_at, is_read",
    )
    .order("received_at", { ascending: false, nullsFirst: false })
    .limit(200);

  if (error) {
    throw new Error(`Posteingang konnte nicht geladen werden: ${error.message}`);
  }

  const mails = data ?? [];
  const unread = mails.filter((m) => !m.is_read).length;

  // Sent mail (via Resend). Best-effort: if the outbound_emails table isn't
  // migrated yet, treat it as empty instead of failing the whole page.
  const { data: sentData } = await supabase
    .from("outbound_emails")
    .select("id, to_email, subject, kind, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  const sent = sentData ?? [];

  return (
    <div className="mt-8 space-y-10">
      <section className="space-y-6">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight">
            Gesendet
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Von Buchwerk verschickte Mails (Resend) · {sent.length} angezeigt.
            Anmelde-/Willkommensmails laufen über Supabase und erscheinen hier
            nicht.
          </p>
        </div>
        {sent.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-sm text-muted-foreground">
            Noch keine gesendeten Mails protokolliert. (Falls gerade erst
            aktiviert: Es werden nur ab jetzt versendete Mails erfasst.)
          </div>
        ) : (
          <ul className="divide-y divide-border border-t border-border">
            {sent.map((m) => (
              <li
                key={m.id}
                className="flex flex-col gap-1 py-4 sm:flex-row sm:items-baseline sm:gap-4"
              >
                <span className="w-full shrink-0 text-xs text-muted-foreground sm:w-40">
                  {fmt(m.created_at)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="truncate text-sm font-medium">
                    an {m.to_email || "—"}
                  </span>
                  <span className="mt-0.5 block truncate text-sm">
                    {m.subject?.trim() || "(kein Betreff)"}
                  </span>
                  {m.kind ? (
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                      {SENT_KIND_LABEL[m.kind] ?? m.kind}
                    </span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-6">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight">
            Posteingang
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Eingehende Mails an welcome@buchwerk.info · {mails.length} angezeigt
            {unread > 0 ? ` · ${unread} ungelesen` : ""}
          </p>
        </div>

      {mails.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-sm text-muted-foreground">
          Noch keine Mails gespiegelt. Sobald der IMAP-Abruf eingerichtet ist
          (Cron liest die welcome@-Mailbox), erscheinen hier die Eingänge.
        </div>
      ) : (
        <ul className="divide-y divide-border border-t border-border">
          {mails.map((m) => (
            <li
              key={m.id}
              className="flex flex-col gap-1 py-4 sm:flex-row sm:items-baseline sm:gap-4"
            >
              <span className="w-full shrink-0 text-xs text-muted-foreground sm:w-40">
                {fmt(m.received_at)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  {!m.is_read && (
                    <span
                      aria-label="ungelesen"
                      className="inline-block size-2 shrink-0 rounded-full bg-primary"
                    />
                  )}
                  <span className="truncate text-sm font-medium">
                    {m.from_name?.trim() || m.from_address || "Unbekannt"}
                  </span>
                </span>
                <span className="mt-0.5 block truncate text-sm">
                  {m.subject?.trim() || "(kein Betreff)"}
                </span>
                <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                  {snippet(m.text_body)}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
      </section>
    </div>
  );
}
