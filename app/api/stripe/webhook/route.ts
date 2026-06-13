import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// Decoupled from Stripe's churning types — we read only what we need.
type StripeSubLike = {
  id: string;
  status: string;
  customer: string;
  current_period_start?: number;
  current_period_end?: number;
  items?: { data?: Array<{ current_period_start?: number; current_period_end?: number }> };
  metadata?: Record<string, string>;
};

type AdminClient = ReturnType<typeof createAdminClient>;

function toIso(seconds: number | undefined): string | null {
  return seconds ? new Date(seconds * 1000).toISOString() : null;
}

async function upsertSubscription(
  admin: AdminClient,
  userId: string,
  sub: StripeSubLike,
): Promise<void> {
  const item = sub.items?.data?.[0];
  await admin.from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_customer_id: sub.customer,
      stripe_subscription_id: sub.id,
      status: sub.status,
      current_period_start: toIso(sub.current_period_start ?? item?.current_period_start),
      current_period_end: toIso(sub.current_period_end ?? item?.current_period_end),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
}

async function sendConfirmationEmail(
  to: string | null | undefined,
  subject: string,
  body: string,
): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key || !to) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Buchwerk <welcome@buchwerk.info>",
        to,
        subject,
        html: body,
      }),
    });
  } catch {
    // non-fatal — the purchase is already recorded
  }
}

export async function POST(request: Request) {
  const stripe = getStripe();
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const payload = await request.text();

  if (!signature || !secret) {
    return new NextResponse("Missing signature", { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, secret);
  } catch {
    return new NextResponse("Invalid signature", { status: 400 });
  }

  const admin = createAdminClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as unknown as {
        id: string;
        subscription?: string | null;
        customer?: string | null;
        amount_total?: number | null;
        customer_details?: { email?: string | null } | null;
        metadata?: Record<string, string> | null;
      };
      const meta = session.metadata ?? {};
      const email = session.customer_details?.email ?? null;

      if (meta.kind === "book" && meta.user_id && meta.project_id) {
        await admin.from("purchases").upsert(
          {
            user_id: meta.user_id,
            project_id: meta.project_id,
            stripe_checkout_session_id: session.id,
            amount_cents: session.amount_total ?? 1999,
          },
          { onConflict: "stripe_checkout_session_id" },
        );
        await admin
          .from("book_unlocks")
          .upsert(
            { project_id: meta.project_id, user_id: meta.user_id, source: "purchase" },
            { onConflict: "project_id" },
          );
        await sendConfirmationEmail(
          email,
          "Dein Buch ist freigeschaltet – Buchwerk",
          "<p>Danke für deinen Kauf. Dein Buchprojekt ist jetzt freigeschaltet (Kapitel, Cover, KDP-Listing, PDF).</p><p>Mit dem Kauf hast du bestätigt, dass die Leistung sofort bereitgestellt wird und dein Widerrufsrecht damit erlischt (§ 356 Abs. 5 BGB).</p><p>— Buchwerk</p>",
        );
      } else if (meta.kind === "subscription" && meta.user_id && session.subscription) {
        const sub = (await stripe.subscriptions.retrieve(
          session.subscription,
        )) as unknown as StripeSubLike;
        await upsertSubscription(admin, meta.user_id, sub);
        await admin.from("profiles").update({ plan: "paid" }).eq("id", meta.user_id);
        await sendConfirmationEmail(
          email,
          "Dein Buchwerk-Abo ist aktiv",
          "<p>Danke! Dein Abo ist aktiv – du kannst bis zu 10 Bücher pro Monat freischalten und produzieren.</p><p>Mit dem Abschluss hast du bestätigt, dass die Leistung sofort bereitgestellt wird und dein Widerrufsrecht damit erlischt (§ 356 Abs. 5 BGB).</p><p>— Buchwerk</p>",
        );
      }
      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as unknown as StripeSubLike;
      let userId = sub.metadata?.user_id;
      if (!userId) {
        const { data: row } = await admin
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_customer_id", sub.customer)
          .maybeSingle();
        userId = row?.user_id ?? undefined;
      }
      if (userId) {
        await upsertSubscription(admin, userId, sub);
        const active = sub.status === "active" || sub.status === "trialing";
        await admin
          .from("profiles")
          .update({ plan: active ? "paid" : "free" })
          .eq("id", userId);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
