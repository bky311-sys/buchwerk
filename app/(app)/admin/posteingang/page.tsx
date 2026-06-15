import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Posteingang — Admin · Buchwerk",
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

  return (
    <div className="mt-8 space-y-6">
      <div>
        <h1 className="text-3xl font-medium tracking-tight sm:text-4xl">
          Posteingang
        </h1>
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
    </div>
  );
}
