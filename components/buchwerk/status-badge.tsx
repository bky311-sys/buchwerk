import { cn } from "@/lib/utils";

// Studio status chips. Three intents matching the design system:
//   done    → grün auf grünem Tint ("✓ Fertig")
//   draft   → clay auf warmem Tint ("Entwurf" / "Wird geschrieben…")
//   neutral → gedämpft auf Paper ("Offen")
type Intent = "done" | "draft" | "neutral";

const INTENT_CLASSES: Record<Intent, string> = {
  done: "bg-success-tint text-success",
  draft: "bg-warning-tint text-clay-strong",
  neutral: "bg-muted text-muted-foreground",
};

export function StatusBadge({
  intent,
  children,
  className,
}: {
  intent: Intent;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold whitespace-nowrap",
        INTENT_CLASSES[intent],
        className,
      )}
    >
      {children}
    </span>
  );
}
