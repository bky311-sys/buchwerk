import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/buchwerk/wordmark";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin/access";
import { signOutAction } from "@/lib/auth/actions";

// Public site header for the marketing home and the Buchshop (both reachable
// while logged out). Auth-aware: logged-in visitors must never see "Anmelden" —
// they get "Meine Projekte" / "Abmelden" instead.
export async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const loggedIn = Boolean(user);
  const showAdmin = loggedIn && isAdminEmail(user?.email);

  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" aria-label="buchwerk – Startseite">
          <Wordmark />
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <Button
            asChild
            variant="ghost"
            size="lg"
            className="hidden sm:inline-flex"
          >
            <Link href="/buchshop">Buchshop</Link>
          </Button>

          {loggedIn ? (
            <>
              {showAdmin ? (
                <Button asChild variant="ghost" size="lg">
                  <Link href="/admin">Admin</Link>
                </Button>
              ) : null}
              <form action={signOutAction}>
                <Button type="submit" variant="ghost" size="lg">
                  Abmelden
                </Button>
              </form>
              <Button asChild size="lg">
                <Link href="/projekte">Meine Projekte</Link>
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="lg">
                <Link href="/anmelden">Anmelden</Link>
              </Button>
              <Button asChild size="lg">
                <Link href="/registrieren">Kostenlos starten</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
