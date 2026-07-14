"use server";

import { revalidatePath } from "next/cache";
import { getAdminUser } from "@/lib/admin/access";
import { createAdminClient } from "@/lib/supabase/admin";
import { grantManualSubscription } from "@/lib/billing/grant";

export type AdminResult = { ok: boolean; error?: string };

const SITE_URL = "https://buchwerk.info";

// Sends the beta tester their preview-token access link (the public site is
// gated), BCC'd to the admin who released it so there's a record. Best-effort:
// the grant itself already succeeded, so a mail hiccup isn't fatal.
async function sendAccessEmail(to: string, bcc: string | null): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  const token = process.env.SITE_BYPASS_TOKEN;
  if (!key) return;
  const link = token
    ? `${SITE_URL}/registrieren?preview=${encodeURIComponent(token)}`
    : `${SITE_URL}/registrieren`;

  const html = `<div style="font-family:Georgia,serif;font-size:15px;line-height:1.6;color:#1c1c1c">
<p>Hallo,</p>
<p>du bekommst einen <strong>offenen Testzugang</strong> für <strong>Buchwerk</strong> &ndash; mit allen Funktionen: vom Thema bis zum fertigen, KDP-tauglichen Buch (recherchiertes Manuskript, Cover, KDP-Listing, eBook &amp; Taschenbuch).</p>
<p>Buchwerk ist noch im geschlossenen Vorab-Modus &ndash; <strong>nimm bitte diesen Link</strong>, er schaltet dich frei:</p>
<p><a href="${link}">Zu Buchwerk (Vorab-Zugang)</a></p>
<p>Registrier dich dort mit <strong>${to}</strong> und best&auml;tige die Willkommens-Mail. Dein voller Zugang wird beim ersten Login automatisch aktiv.</p>
<p>Viel Spa&szlig; &ndash; und ich freu mich auf dein Feedback!</p>
<p>Viele Gr&uuml;&szlig;e<br>Benjamin &ndash; Buchwerk</p>
</div>`;
  const text = `Hallo,

du bekommst einen offenen Testzugang für Buchwerk – mit allen Funktionen: vom Thema bis zum fertigen, KDP-tauglichen Buch (recherchiertes Manuskript, Cover, KDP-Listing, eBook & Taschenbuch).

Buchwerk ist noch im geschlossenen Vorab-Modus – nimm bitte diesen Link, er schaltet dich frei:
${link}

Registrier dich dort mit ${to} und bestätige die Willkommens-Mail. Dein voller Zugang wird beim ersten Login automatisch aktiv.

Viele Grüße
Benjamin – Buchwerk`;

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Buchwerk <welcome@buchwerk.info>",
        to,
        ...(bcc ? { bcc } : {}),
        reply_to: "welcome@buchwerk.info",
        subject: "Dein Zugangs-Link für Buchwerk",
        html,
        text,
      }),
    });
  } catch {
    // non-fatal
  }
}

// Releases full test access to a waitlist signup: marks them for the auto-grant
// on registration, grants immediately if they already have an account, and mails
// them the preview-token link.
export async function grantWaitlistAccessAction(
  email: string,
): Promise<AdminResult> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "Nicht erlaubt." };

  const supabase = createAdminClient();

  // Already registered? Grant right away and mark it done.
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  const alreadyRegistered = Boolean(profile?.id);
  if (profile?.id) {
    await grantManualSubscription(profile.id);
  }

  const { error } = await supabase
    .from("waitlist")
    .update({
      test_access: true,
      invited_at: new Date().toISOString(),
      ...(alreadyRegistered
        ? { access_granted_at: new Date().toISOString() }
        : {}),
    })
    .eq("email", email);
  if (error) return { ok: false, error: "Konnte nicht freigeben." };

  await sendAccessEmail(email, admin.email ?? null);

  revalidatePath("/admin");
  return { ok: true };
}
