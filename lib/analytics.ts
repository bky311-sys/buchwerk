import { track } from "@vercel/analytics/server";

/**
 * Server-seitiges Funnel-Event (Vercel Web Analytics). Fehler werden
 * geschluckt: Analytics darf Registrierung, Checkout und Webhook nie brechen.
 */
export async function trackEvent(
  name: string,
  data?: Record<string, string | number | boolean>,
): Promise<void> {
  try {
    await track(name, data);
  } catch {
    // bewusst still
  }
}
