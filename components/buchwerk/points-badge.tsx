import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getPointsBalance } from "@/lib/shop/points";

// Überall sichtbares Punkte-Badge im Header. Vorher gab es den Punktestand
// NUR versteckt im Boost-Block der eigenen Veröffentlichen-Seite — wer kein
// eigenes Buch im Shop hatte, sah seinen Stand nirgends (Benjamins Fund
// 05.08.: "wo sammelt man die Punkte? Das wird nicht deutlich genug").
//
// Eigenständige Server Component (holt sich User + Balance selbst), damit sie
// sich ohne Props einfach in beide Header-Varianten einsetzen lässt.
export async function PointsBadge() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const points = await getPointsBalance(supabase, user.id);

  return (
    <Link
      href="/buchshop"
      title="Punkte sammelst du, indem du gelesene Bücher im Buchshop bewertest. Einlösbar zum Boosten deines eigenen Buchs."
      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted/70"
    >
      <span aria-hidden>★</span>
      <span className="tabular-nums">{points}</span>
      <span className="hidden sm:inline">Punkte</span>
    </Link>
  );
}
