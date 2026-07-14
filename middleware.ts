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

export async function middleware(request: NextRequest) {
  const gate = maintenanceGate(request);
  if (gate) return gate;
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
