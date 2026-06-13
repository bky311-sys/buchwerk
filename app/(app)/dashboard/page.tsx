import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Dashboard — Buchwerk",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="mx-auto max-w-5xl px-6 py-20 sm:py-28">
      <h1 className="text-3xl font-medium tracking-tight sm:text-4xl">
        Willkommen bei Buchwerk
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
        Du bist als{" "}
        <span className="text-foreground">{user?.email}</span> angemeldet.
        Starte dein erstes Buch oder arbeite an einem bestehenden Projekt weiter.
      </p>
      <div className="mt-8">
        <Button asChild size="lg">
          <Link href="/projekte">Meine Projekte</Link>
        </Button>
      </div>
    </div>
  );
}
