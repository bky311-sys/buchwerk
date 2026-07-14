import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { grantManualSubscription } from "@/lib/billing/grant";

export const runtime = "nodejs";

// If this signup was released for test access on the waitlist, grant the full
// (manual) subscription now — once. Best-effort: never blocks the login.
async function grantBetaAccessIfReleased(
  email: string | undefined,
): Promise<void> {
  if (!email) return;
  try {
    const admin = createAdminClient();
    const { data: row } = await admin
      .from("waitlist")
      .select("email, test_access, access_granted_at")
      .eq("email", email)
      .maybeSingle();
    if (!row?.test_access || row.access_granted_at) return;

    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    if (!profile?.id) return;

    const ok = await grantManualSubscription(profile.id);
    if (ok) {
      await admin
        .from("waitlist")
        .update({ access_granted_at: new Date().toISOString() })
        .eq("email", email);
    }
  } catch {
    // non-fatal
  }
}

// Same-site relative targets only — see sanitizeNext in lib/auth/actions.ts.
function safeNext(value: string | null): string {
  if (value && value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }
  return "/dashboard";
}

/**
 * Exchanges the one-time code from a Supabase email link (signup confirmation,
 * later also magic link / OAuth) for a session, then redirects into the app.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      await grantBetaAccessIfReleased(user?.email);

      // While the coming-soon gate is up, carry the preview token on the
      // post-confirmation redirect so the browser that opened the email link
      // also gets the bypass cookie — otherwise a confirmed beta tester would
      // land on /bald. Only holders of a valid one-time code reach this branch.
      const target = new URL(`${origin}${next}`);
      const bypass = process.env.SITE_BYPASS_TOKEN;
      if (process.env.SITE_LIVE !== "true" && bypass) {
        target.searchParams.set("preview", bypass);
      }
      return NextResponse.redirect(target);
    }
  }

  return NextResponse.redirect(`${origin}/anmelden?fehler=bestaetigung`);
}
