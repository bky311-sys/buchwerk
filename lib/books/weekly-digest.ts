import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

// Wochen-Mail „Dein Buch diese Woche" (Maßnahmenplan 12.08.): montags fasst
// der tägliche Cron pro veröffentlichtem Buch mit Amazon-Link die Woche
// zusammen — Rang-Veränderung, neue Bewertungen, Preis. Nur wenn es Daten
// gibt: ohne OK-Messung in den letzten 7 Tagen wird nichts verschickt (eine
// „leider wissen wir nichts"-Mail trainiert Empfänger aufs Ignorieren).
// Versand über Resend wie die Kauf-Bestätigung (Stripe-Webhook).

const MAX_MAILS_PER_RUN = 50;

export type DigestRunResult = {
  ok: boolean;
  sent: number;
  skipped: number;
};

type MetricRow = {
  captured_at: string;
  bsr: number | null;
  ratings_count: number | null;
  rating: number | null;
  price_eur: number | null;
  ok: boolean;
};

function formatNumber(n: number): string {
  return n.toLocaleString("de-DE");
}

function buildDigestHtml(
  title: string,
  latest: MetricRow,
  baseline: MetricRow | null,
  projectId: string,
): string {
  const lines: string[] = [];

  if (latest.bsr !== null) {
    let trend = "";
    if (baseline?.bsr != null && baseline.bsr !== latest.bsr) {
      const delta = latest.bsr - baseline.bsr;
      trend =
        delta < 0
          ? ` — <strong>${formatNumber(Math.abs(delta))} Plätze besser</strong> als vor einer Woche`
          : ` — ${formatNumber(delta)} Plätze schlechter als vor einer Woche`;
    }
    lines.push(
      `<li>Bestseller-Rang: <strong>Nr. ${formatNumber(latest.bsr)}</strong>${trend}</li>`,
    );
  }

  if (latest.ratings_count !== null) {
    const fresh =
      baseline?.ratings_count != null
        ? latest.ratings_count - baseline.ratings_count
        : 0;
    lines.push(
      `<li>Bewertungen: <strong>${formatNumber(latest.ratings_count)}</strong>${
        fresh > 0 ? ` (<strong>+${formatNumber(fresh)} neu</strong> diese Woche)` : ""
      }${latest.rating !== null ? ` · Ø ${latest.rating.toLocaleString("de-DE", { maximumFractionDigits: 1 })} Sterne` : ""}</li>`,
    );
  }

  if (latest.price_eur !== null) {
    lines.push(
      `<li>Angezeigter Preis: ${latest.price_eur.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €</li>`,
    );
  }

  return [
    `<p>Hallo,</p>`,
    `<p>so steht „${title}“ diese Woche bei Amazon:</p>`,
    `<ul>${lines.join("")}</ul>`,
    `<p><a href="https://buchwerk.info/projekte/${projectId}">Zum Verlauf in deinem Projekt →</a></p>`,
    `<p>— Buchwerk. Wenn du diese Wochen-Mail nicht mehr möchtest, antworte einfach kurz auf diese Nachricht.</p>`,
  ].join("");
}

async function sendMail(
  to: string,
  subject: string,
  html: string,
): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Buchwerk <welcome@buchwerk.info>",
        to,
        subject,
        html,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function sendWeeklyBookDigest(): Promise<DigestRunResult> {
  const admin = createAdminClient();

  const { data: books, error } = await admin
    .from("projects")
    .select("id, title, topic, user_id")
    .not("amazon_url", "is", null)
    .not("published_at", "is", null)
    .limit(MAX_MAILS_PER_RUN);
  if (error) return { ok: false, sent: 0, skipped: 0 };

  const since = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
  let sent = 0;
  let skipped = 0;

  for (const book of books ?? []) {
    const { data: rows } = await admin
      .from("book_metrics")
      .select("captured_at, bsr, ratings_count, rating, price_eur, ok")
      .eq("project_id", book.id)
      .gte("captured_at", since)
      .order("captured_at", { ascending: true });

    const okRows = (rows ?? []).filter((r) => r.ok);
    const latest = okRows[okRows.length - 1];
    if (!latest || (latest.bsr === null && latest.ratings_count === null)) {
      skipped += 1;
      continue;
    }
    const baseline = okRows.length > 1 ? okRows[0] : null;

    const { data: userData } = await admin.auth.admin.getUserById(book.user_id);
    const email = userData?.user?.email;
    if (!email) {
      skipped += 1;
      continue;
    }

    const title = book.title ?? book.topic;
    const okSent = await sendMail(
      email,
      `Dein Buch diese Woche: ${title}`,
      buildDigestHtml(title, latest, baseline, book.id),
    );
    if (okSent) sent += 1;
    else skipped += 1;
  }

  return { ok: true, sent, skipped };
}
