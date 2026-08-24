import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const PREVIEW_COOKIE = "bw_preview";

// Pre-launch gate: while SITE_LIVE !== "true", the public sees /bald.
// Returns a response to short-circuit, or null to continue normally.
function maintenanceGate(request: NextRequest): NextResponse | null {
  if (process.env.SITE_LIVE === "true") return null;

  const { pathname, searchParams } = request.nextUrl;

  // Keep API (Stripe webhook etc.), the auth plumbing (email-confirmation code
  // exchange) and the coming-soon page itself reachable. /auth/* must never be
  // gated: a swallowed confirmation code can't be retried (it's one-time), which
  // would lock invited beta testers out for good.
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/auth") ||
    pathname === "/bald"
  ) {
    return null;
  }

  const token = process.env.SITE_BYPASS_TOKEN;

  // Unlock via ?preview=<token>: set a cookie and reload without the param.
  const provided = searchParams.get("preview");
  if (token && provided && provided === token) {
    const url = request.nextUrl.clone();
    url.searchParams.delete("preview");
    const res = NextResponse.redirect(url);
    res.cookies.set(PREVIEW_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  }

  // Already unlocked.
  if (token && request.cookies.get(PREVIEW_COOKIE)?.value === token) {
    return null;
  }

  // Everyone else → coming-soon page.
  const url = request.nextUrl.clone();
  url.pathname = "/bald";
  url.search = "";
  return NextResponse.rewrite(url);
}

const UTM_COOKIE = "bw_utm";
const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
] as const;

// First-Touch-Kampagnenzuordnung: Landet ein Besucher mit utm_-Parametern
// (Werbeklick), wird die Herkunft 30 Tage als Cookie gehalten und bei der
// Registrierung ans Profil geschrieben (profiles.acquisition). Ein schon
// gesetztes Cookie gewinnt — der erste Kontakt zählt.
function captureUtm(request: NextRequest, response: NextResponse): void {
  if (request.cookies.get(UTM_COOKIE)) return;
  const params = request.nextUrl.searchParams;
  if (!params.get("utm_source")) return;
  const data: Record<string, string> = {};
  for (const key of UTM_KEYS) {
    const value = params.get(key);
    if (value) data[key] = value.slice(0, 120);
  }
  data.landing = request.nextUrl.pathname.slice(0, 200);
  data.ts = new Date().toISOString();
  response.cookies.set(UTM_COOKIE, JSON.stringify(data), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function middleware(request: NextRequest) {
  const gate = maintenanceGate(request);
  if (gate) return gate;
  const response = await updateSession(request);
  captureUtm(request, response);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
