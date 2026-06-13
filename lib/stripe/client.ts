import Stripe from "stripe";

// Single Stripe client. apiVersion is left at the SDK default to avoid
// version-string drift; we call fetch via the official SDK only.
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY ist nicht gesetzt.");
  return new Stripe(key);
}

export const PRICE_BOOK = () => process.env.STRIPE_PRICE_BOOK ?? "";
export const PRICE_SUBSCRIPTION = () => process.env.STRIPE_PRICE_SUB ?? "";
