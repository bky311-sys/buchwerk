import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/buchwerk/wordmark";
import { LegalFooter } from "@/components/buchwerk/legal-footer";
import { PointsBadge } from "@/components/buchwerk/points-badge";
import { MobileMenu } from "@/components/buchwerk/mobile-menu";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin/access";
import { signOutAction } from "@/lib/auth/actions";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Defense in depth: middleware already guards /dashboard, but a layout-level
  // check protects against any future route that skips the matcher.
  if (!user) {
    redirect("/anmelden");
  }

  const showAdmin = isAdminEmail(user.email);

  return (
    <>
      {/* Mobil: Logo + Punkte + „Meine Projekte" + Burger; alles Sekundäre im
          Menü. Vorher liefen die Buttons auf 375px-Geräten über. */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-3 sm:px-6 sm:py-4">
          <Link
            href="/projekte"
            aria-label="buchwerk – Meine Projekte"
            className="shrink-0"
          >
            <Wordmark className="[&>span:last-child]:text-lg sm:[&>span:last-child]:text-xl" />
          </Link>
          <nav className="flex min-w-0 items-center gap-1.5 sm:gap-2">
            <PointsBadge />
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="sm:h-11 sm:px-6 sm:text-[0.95rem]"
            >
              <Link href="/projekte">Meine Projekte</Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="lg"
              className="hidden sm:inline-flex"
            >
              <Link href="/buchshop">Buchshop</Link>
            </Button>
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
            <MobileMenu
              links={[
                { href: "/buchshop", label: "Buchshop" },
                { href: "/ratgeber", label: "Ratgeber" },
                ...(showAdmin ? [{ href: "/admin", label: "Admin" }] : []),
              ]}
            >
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="block w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  Abmelden
                </button>
              </form>
            </MobileMenu>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <LegalFooter />
    </>
  );
}
