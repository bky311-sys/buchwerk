import { cn } from "@/lib/utils";

// Read-only star display. `value` is rounded to the nearest whole star.
export function Stars({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const filled = Math.round(value);
  return (
    <span
      className={cn("inline-flex text-primary", className)}
      aria-label={`${value} von 5 Sternen`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= filled ? "" : "text-input"} aria-hidden>
          ★
        </span>
      ))}
    </span>
  );
}
