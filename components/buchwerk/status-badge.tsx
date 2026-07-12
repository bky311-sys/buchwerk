import { cn } from "@/lib/utils";

// Studio status chips. Intents matching the design system:
//   done    → grün auf grünem Tint ("✓ Fertig")
//   draft   → clay auf warmem Tint ("Entwurf" / "Wird geschrieben…")
//   neutral → gedämpft auf Paper ("Offen")
//   error   → Terracotta/destructive für fehlgeschlagene Generierung
type Intent = "done" | "draft" | "neutral" | "error";

const INTENT_CLASSES: Record<Intent, string> = {
  done: "bg-success-tint text-success",
  draft: "bg-warning-tint text-clay-strong",
  neutral: "bg-muted text-muted-foreground",
  error: "bg-destructive/10 text-destructive",
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
