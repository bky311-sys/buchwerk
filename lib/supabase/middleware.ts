import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/supabase";

// Paths inside the authenticated app area. Unauthenticated visitors hitting
// these are bounced to /anmelden with a ?weiter= return target.
const PROTECTED_PREFIXES = ["/dashboard"] as const;

// Auth pages an already-authenticated user has no reason to see.
const AUTH_PAGES = ["/anmelden", "/registrieren"] as const;

/**
 * Refreshes the Supabase auth session on every request and enforces coarse
 * route protection. Called from the root middleware.
 *
 * The server.ts client only reads cookies; without this the session token is
 * never rotated and logged-in users get silently signed out when it expires.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const path = request.nextUrl.pathname;

  // Anonyme Besucher (kein Supabase-Auth-Cookie) brauchen keinen Session-
  // Refresh: kein Supabase-Roundtrip pro Seitenaufruf, und die öffentlichen
  // Seiten bleiben erreichbar, selbst wenn Supabase Auth hängt.
  const hasAuthCookie = request.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-") && c.name.includes("-auth-token"));
  if (!hasAuthCookie) {
    if (PROTECTED_PREFIXES.some((p) => path.startsWith(p))) {
      const url = request.nextUrl.clone();
      url.pathname = "/anmelden";
      url.searchParams.set("weiter", path);
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        // Hängender Auth-Server darf nie die Seite blockieren: Vercel killt
        // Middleware hart nach 25 s (504 für den Besucher). Nach 5 s brechen
        // wir selbst ab und lassen den Request ohne Refresh durch.
        fetch: (input, init) =>
          fetch(input, { ...init, signal: AbortSignal.timeout(5000) }),
      },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: do not run any code between createServerClient and getUser().
  // getUser() revalidates the token with Supabase and refreshes cookies.
  let user: Awaited<
    ReturnType<typeof supabase.auth.getUser>
  >["data"]["user"] = null;
  try {
    ({
      data: { user },
    } = await supabase.auth.getUser());
  } catch {
    // Timeout/Netzfehler: Request durchlassen, die Seiten prüfen Auth selbst
    // (Server-Komponenten rufen getUser erneut auf, Writes deckt RLS).
    return supabaseResponse;
  }

  if (!user && PROTECTED_PREFIXES.some((p) => path.startsWith(p))) {
    const url = request.nextUrl.clone();
    url.pathname = "/anmelden";
    url.searchParams.set("weiter", path);
    return NextResponse.redirect(url);
  }

  if (user && AUTH_PAGES.includes(path as (typeof AUTH_PAGES)[number])) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
