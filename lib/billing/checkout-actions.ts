"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { getStripe, PRICE_BOOK, PRICE_SUBSCRIPTION } from "@/lib/stripe/client";

export type CheckoutResult = { error: string | null };

async function getOrigin(): Promise<string> {
  const h = await headers();
  const origin = h.get("origin");
  if (origin) return origin;
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  if (host) return `${proto}://${host}`;
  return "https://buchwerk.info";
}

async function getOrCreateCustomer(
  stripe: Stripe,
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  email: string | undefined,
): Promise<string> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", userId)
    .maybeSingle();
  if (profile?.stripe_customer_id) return profile.stripe_customer_id;

  const customer = await stripe.customers.create({
    email,
    metadata: { user_id: userId },
  });
  await supabase
    .from("profiles")
    .update({ stripe_customer_id: customer.id })
    .eq("id", userId);
  return customer.id;
}

export async function checkoutBookAction(
  projectId: string,
  consent: boolean,
): Promise<CheckoutResult> {
  if (!consent) {
    return { error: "Bitte bestätige beide Hinweise zum Widerrufsrecht." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/anmelden");

  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .single();
  if (!project) return { error: "Projekt nicht gefunden." };

  const stripe = getStripe();
  const origin = await getOrigin();
  const customer = await getOrCreateCustomer(
    stripe,
    supabase,
    user.id,
    user.email ?? undefined,
  );

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer,
    locale: "de",
    line_items: [{ price: PRICE_BOOK(), quantity: 1 }],
    success_url: `${origin}/projekte/${projectId}?freigeschaltet=1`,
    cancel_url: `${origin}/projekte/${projectId}/freischalten`,
    metadata: {
      kind: "book",
      user_id: user.id,
      project_id: projectId,
      widerruf_consent: "true",
    },
  });

  if (!session.url) return { error: "Checkout konnte nicht gestartet werden." };
  redirect(session.url);
}

export async function checkoutSubscriptionAction(
  consent: boolean,
): Promise<CheckoutResult> {
  if (!consent) {
    return { error: "Bitte bestätige beide Hinweise zum Widerrufsrecht." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/anmelden");

  const stripe = getStripe();
  const origin = await getOrigin();
  const customer = await getOrCreateCustomer(
    stripe,
    supabase,
    user.id,
    user.email ?? undefined,
  );

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer,
    locale: "de",
    line_items: [{ price: PRICE_SUBSCRIPTION(), quantity: 1 }],
    success_url: `${origin}/projekte?abo=1`,
    cancel_url: `${origin}/projekte`,
    metadata: { kind: "subscription", user_id: user.id, widerruf_consent: "true" },
    subscription_data: { metadata: { user_id: user.id } },
  });

  if (!session.url) return { error: "Checkout konnte nicht gestartet werden." };
  redirect(session.url);
}
