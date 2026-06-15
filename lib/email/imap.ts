import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";

export type FetchedMail = {
  messageId: string | null;
  imapUid: number;
  fromAddress: string | null;
  fromName: string | null;
  toAddress: string | null;
  subject: string | null;
  textBody: string | null;
  htmlBody: string | null;
  receivedAt: string | null;
};

/**
 * Reads new messages from the welcome@buchwerk.info mailbox over IMAP and
 * returns them parsed. Only messages with a UID greater than `sinceUid` are
 * fetched, so repeated polls never re-process the same mail.
 *
 * Credentials come from env (never hard-coded):
 *   IMAP_HOST, IMAP_PORT (default 993), IMAP_USER, IMAP_PASSWORD
 *
 * This only reads the mailbox — no DNS/MX change, the mailbox keeps working.
 */
export async function fetchNewMail(sinceUid: number): Promise<FetchedMail[]> {
  const host = process.env.IMAP_HOST;
  const user = process.env.IMAP_USER;
  const pass = process.env.IMAP_PASSWORD;
  if (!host || !user || !pass) {
    throw new Error(
      "IMAP_HOST, IMAP_USER und IMAP_PASSWORD müssen gesetzt sein.",
    );
  }
  const port = Number(process.env.IMAP_PORT ?? "993");

  const client = new ImapFlow({
    host,
    port,
    secure: port === 993,
    auth: { user, pass },
    logger: false,
  });

  const results: FetchedMail[] = [];
  await client.connect();
  const lock = await client.getMailboxLock("INBOX");
  try {
    // `${sinceUid + 1}:*` is interpreted as a UID range. IMAP always returns at
    // least the last message for an open-ended range, so we re-check the UID.
    const range = `${sinceUid + 1}:*`;
    for await (const msg of client.fetch(
      range,
      { uid: true, source: true },
      { uid: true },
    )) {
      if (!msg.source || msg.uid <= sinceUid) continue;

      const parsed = await simpleParser(msg.source);
      const fromAddr = parsed.from?.value?.[0];
      const toText = Array.isArray(parsed.to)
        ? parsed.to.map((t) => t.text).join(", ")
        : (parsed.to?.text ?? null);

      results.push({
        messageId: parsed.messageId ?? null,
        imapUid: msg.uid,
        fromAddress: fromAddr?.address ?? null,
        fromName: fromAddr?.name || null,
        toAddress: toText,
        subject: parsed.subject ?? null,
        textBody: parsed.text ?? null,
        htmlBody: typeof parsed.html === "string" ? parsed.html : null,
        receivedAt: parsed.date?.toISOString() ?? null,
      });
    }
  } finally {
    lock.release();
  }
  await client.logout();

  return results;
}
