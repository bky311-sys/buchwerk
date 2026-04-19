import * as Sentry from "@sentry/nextjs";

export async function register() {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  const common = {
    dsn,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    tracesSampleRate: 0,
  };

  if (process.env.NEXT_RUNTIME === "nodejs") {
    Sentry.init(common);
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    Sentry.init(common);
  }
}

export const onRequestError = Sentry.captureRequestError;
