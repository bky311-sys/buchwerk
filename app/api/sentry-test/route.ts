import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Diagnostic endpoint to verify Sentry integration is capturing errors.
 * Throws on every call. Safe to keep around — no side effects, no data access.
 */
export function GET() {
  throw new Error(
    "Sentry test error — ausgelöst von /api/sentry-test, " +
      new Date().toISOString(),
  );
  // Unreachable but satisfies the type checker.
  return NextResponse.json({ ok: false });
}
