import { Resend } from "resend";

let cachedClient: Resend | null = null;

function getClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set.");
  }
  if (!cachedClient) cachedClient = new Resend(apiKey);
  return cachedClient;
}

const FROM_ADDRESS = "Buchwerk <welcome@buchwerk.info>";
const REPLY_TO = "welcome@buchwerk.info";

type SendConfirmationArgs = {
  to: string;
  token: string;
  origin: string;
};

export async function sendConfirmationEmail({
  to,
  token,
  origin,
}: SendConfirmationArgs): Promise<{ id: string } | { error: string }> {
  const confirmUrl = `${origin.replace(/\/$/, "")}/bestaetigen?token=${encodeURIComponent(token)}`;

  const subject = "Bestätige deine Anmeldung auf der Buchwerk-Warteliste";
  const html = buildHtml(confirmUrl);
  const text = buildText(confirmUrl);

  const { data, error } = await getClient().emails.send({
    from: FROM_ADDRESS,
    to: [to],
    replyTo: REPLY_TO,
    subject,
    html,
    text,
  });

  if (error) {
    return { error: error.message ?? "Unknown Resend error." };
  }
  return { id: data?.id ?? "unknown" };
}

function buildHtml(confirmUrl: string): string {
  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Buchwerk — Bestätigung</title>
</head>
<body style="margin:0;padding:24px;background:#F5F1EB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#1F1B15;">
<div style="max-width:480px;margin:0 auto;">
<p style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#6B5E4F;margin:0 0 12px;">Buchwerk.info</p>
<h1 style="font-size:24px;font-weight:500;line-height:1.2;margin:0 0 24px;">Fast geschafft.</h1>
<p style="font-size:16px;line-height:1.55;margin:0 0 20px;">Danke für deine Eintragung auf der Warteliste. Damit wir wissen, dass die Email-Adresse wirklich dir gehört, klick bitte einmal kurz auf den folgenden Link:</p>
<p style="margin:0 0 28px;">
<a href="${confirmUrl}" style="display:inline-block;background:#2E6B3D;color:#FFFFFF;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:500;">Anmeldung bestätigen</a>
</p>
<p style="font-size:13px;line-height:1.55;color:#6B5E4F;margin:0 0 16px;">Falls der Button nicht funktioniert, kopier diesen Link in deinen Browser:<br><span style="word-break:break-all;color:#1F1B15;">${confirmUrl}</span></p>
<hr style="border:0;border-top:1px solid #D6CDBF;margin:32px 0;">
<p style="font-size:13px;line-height:1.55;color:#6B5E4F;margin:0 0 12px;">Du bekommst genau eine weitere Mail von uns — wenn Buchwerk offiziell startet. Kein Newsletter.</p>
<p style="font-size:12px;line-height:1.5;color:#6B5E4F;margin:0;">Du hast dich nicht angemeldet? Dann ignorier diese Mail einfach, dein Eintrag wird innerhalb von 48 Stunden automatisch gelöscht.</p>
</div>
</body>
</html>`;
}

function buildText(confirmUrl: string): string {
  return [
    "Buchwerk.info",
    "",
    "Fast geschafft.",
    "",
    "Danke für deine Eintragung auf der Warteliste. Damit wir wissen, dass die Email-Adresse wirklich dir gehört, klick bitte einmal kurz auf den folgenden Link:",
    "",
    confirmUrl,
    "",
    "Du bekommst genau eine weitere Mail von uns — wenn Buchwerk offiziell startet. Kein Newsletter.",
    "",
    "Du hast dich nicht angemeldet? Dann ignorier diese Mail einfach, dein Eintrag wird innerhalb von 48 Stunden automatisch gelöscht.",
  ].join("\n");
}
