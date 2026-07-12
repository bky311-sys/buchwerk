import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/buchwerk/wordmark";
import { LegalFooter } from "@/components/buchwerk/legal-footer";
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
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/projekte" aria-label="buchwerk – Meine Projekte">
            <Wordmark />
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2">
            <Button asChild variant="ghost" size="lg">
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
              <Button asChild variant="ghost" size="lg">
                <Link href="/admin">Admin</Link>
              </Button>
            ) : null}
            <form action={signOutAction}>
              <Button type="submit" variant="ghost" size="lg">
                Abmelden
              </Button>
            </form>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <LegalFooter />
    </>
  );
}
