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

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

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
