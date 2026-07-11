import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/buchwerk/wordmark";
import { createClient } from "@/lib/supabase/server";
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

  return (
    <>
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" aria-label="buchwerk – Dashboard">
            <Wordmark />
          </Link>
          <form action={signOutAction}>
            <Button type="submit" variant="ghost" size="lg">
              Abmelden
            </Button>
          </form>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </>
  );
}
