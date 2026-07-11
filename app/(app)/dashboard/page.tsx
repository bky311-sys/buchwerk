import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin/access";
import { getPointsBalance } from "@/lib/shop/points";

export const metadata: Metadata = {
  title: "Dashboard — Buchwerk",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const showAdmin = isAdminEmail(user?.email);
  const points = user ? await getPointsBalance(supabase, user.id) : 0;

  return (
    <div className="mx-auto max-w-5xl px-6 py-20 sm:py-28">
      <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
        Willkommen bei Buchwerk
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
        Du bist als{" "}
        <span className="text-foreground">{user?.email}</span> angemeldet.
        Starte dein erstes Buch oder arbeite an einem bestehenden Projekt weiter.
      </p>
      <div className="mt-8 inline-flex items-center gap-3 rounded-2xl border border-border bg-card px-5 py-4">
        <span className="font-display text-3xl font-bold tabular-nums text-primary">
          {points}
        </span>
        <span className="text-sm text-muted-foreground">
          Punkte
          <br />
          aus Bewertungen
        </span>
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        <Button asChild size="lg">
          <Link href="/projekte">Meine Projekte</Link>
        </Button>
        {showAdmin ? (
          <Button asChild size="lg" variant="outline">
            <Link href="/admin">Admin</Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
