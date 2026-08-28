import { POINT_COSTS, type PointAction } from "@/lib/points/costs";

// Zeigt am Auslöser, was ein KI-Lauf kostet (Punkte-Modell 28.08.). Vorher
// konnte man Knöpfe drücken, ohne den Preis zu kennen — erst die Fehlermeldung
// „dafür brauchst du X Punkte" hätte es verraten.
export function PointCost({
  action,
  factor = 1,
  className = "",
}: {
  action: PointAction;
  /** Vielfaches, z. B. Anzahl offener Kapitel beim Sammel-Lauf. */
  factor?: number;
  className?: string;
}) {
  const total = POINT_COSTS[action] * Math.max(1, factor);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground ${className}`}
      title="Punkte für diesen KI-Lauf. Der Export deines Buchs kostet nie Punkte."
    >
      <span aria-hidden>★</span>
      {total} {total === 1 ? "Punkt" : "Punkte"}
    </span>
  );
}
