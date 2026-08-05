import { createClient } from "@/lib/supabase/server";
import { getPointsBalance, POINTS_PER_REVIEW } from "@/lib/shop/points";
import { PointsPopover } from "@/components/buchwerk/points-popover";

// Überall sichtbares Punkte-Badge im Header. Vorher gab es den Punktestand
// NUR versteckt im Boost-Block der eigenen Veröffentlichen-Seite — wer kein
// eigenes Buch im Shop hatte, sah seinen Stand nirgends (Benjamins Fund
// 05.08.: "wo sammelt man die Punkte? Das wird nicht deutlich genug").
// Klick öffnet eine Erklärung statt nur direkt in den Buchshop zu springen
// (Anschluss-Feedback, selber Tag).
//
// Eigenständige Server Component (holt sich User + Balance selbst), damit sie
// sich ohne Props einfach in beide Header-Varianten einsetzen lässt. Das
// Popover selbst ist Client-seitig ausgelagert (Auf-/Zuklapp-State).
export async function PointsBadge() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const points = await getPointsBalance(supabase, user.id);

  return <PointsPopover points={points} pointsPerReview={POINTS_PER_REVIEW} />;
}
