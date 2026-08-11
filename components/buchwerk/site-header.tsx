import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/buchwerk/wordmark";
import { PointsBadge } from "@/components/buchwerk/points-badge";
import { MobileMenu } from "@/components/buchwerk/mobile-menu";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin/access";
import { signOutAction } from "@/lib/auth/actions";

// Public site header for the marketing home and the Buchshop (both reachable
// while logged out). Auth-aware: logged-in visitors must never see "Anmelden" —
// they get "Meine Projekte" / "Abmelden" instead.
//
// Mobil (unter `sm`) zeigt der Header nur Logo, Punkte-Badge und den einen
// Primär-CTA — alles Sekundäre steckt im Burger-Menü. Vorher standen bis zu
// fünf Buttons nebeneinander (~480px) und liefen auf 375px-Geräten über
// (Benjamins Fund, 11.08.).
export async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const loggedIn = Boolean(user);
  const showAdmin = loggedIn && isAdminEmail(user?.email);

  const mobileLinks = [
    { href: "/ratgeber", label: "Ratgeber" },
    { href: "/buchshop", label: "Buchshop" },
    ...(loggedIn ? [] : [{ href: "/anmelden", label: "Anmelden" }]),
    ...(showAdmin ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-3 sm:px-6 sm:py-4">
        <Link href="/" aria-label="buchwerk – Startseite" className="shrink-0">
          <Wordmark className="[&>span:last-child]:text-lg sm:[&>span:last-child]:text-xl" />
        </Link>
        <nav className="flex min-w-0 items-center gap-1.5 sm:gap-2">
          <Button
            asChild
            variant="ghost"
            size="lg"
            className="hidden sm:inline-flex"
          >
            <Link href="/ratgeber">Ratgeber</Link>
          </Button>
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
              <PointsBadge />
              {showAdmin ? (
                <Button
                  asChild
                  variant="ghost"
                  size="lg"
                  className="hidden sm:inline-flex"
                >
                  <Link href="/admin">Admin</Link>
                </Button>
              ) : null}
              <form action={signOutAction} className="hidden sm:block">
                <Button type="submit" variant="ghost" size="lg">
                  Abmelden
                </Button>
              </form>
              <Button asChild size="sm" className="sm:h-11 sm:px-6">
                <Link href="/projekte">Meine Projekte</Link>
              </Button>
            </>
          ) : (
            <>
              <Button
                asChild
                variant="ghost"
                size="lg"
                className="hidden sm:inline-flex"
              >
                <Link href="/anmelden">Anmelden</Link>
              </Button>
              <Button asChild size="sm" className="sm:h-11 sm:px-6">
                <Link href="/registrieren">Kostenlos starten</Link>
              </Button>
            </>
          )}

          <MobileMenu links={mobileLinks}>
            {loggedIn ? (
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="block w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  Abmelden
                </button>
              </form>
            ) : null}
          </MobileMenu>
        </nav>
      </div>
    </header>
  );
}
