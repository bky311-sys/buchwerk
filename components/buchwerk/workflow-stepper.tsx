import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type WorkflowStep = {
  label: string;
  // "done" = abgeschlossen, "current" = dran, "todo" = später, "optional" = übersprungen aber ok
  status: "done" | "current" | "todo" | "optional";
  href: string;
  // Kurze Handlungsaufforderung für den aktuellen Schritt.
  cta?: string;
};

// Guided top-to-bottom workflow: Recherche → Manuskript → Cover → KDP → Live.
// Shows where the author is and what the single next action is, so the project
// page reads as a sequence instead of a flat pile of options.
export function WorkflowStepper({ steps }: { steps: WorkflowStep[] }) {
  const current = steps.find((s) => s.status === "current");
  const doneCount = steps.filter((s) => s.status === "done").length;

  return (
    <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-3">
        {steps.map((step, index) => {
          const isDone = step.status === "done";
          const isCurrent = step.status === "current";
          return (
            <li key={step.label} className="flex items-center gap-2">
              <Link
                href={step.href}
                className="group inline-flex items-center gap-2"
                aria-current={isCurrent ? "step" : undefined}
              >
                <span
                  className={cn(
                    "flex size-7 items-center justify-center rounded-full text-xs font-bold tabular-nums transition-colors",
                    isDone && "bg-primary text-primary-foreground",
                    isCurrent && "bg-primary/15 text-primary ring-2 ring-primary",
                    step.status === "todo" && "bg-muted text-muted-foreground",
                    step.status === "optional" &&
                      "bg-muted text-muted-foreground ring-1 ring-border",
                  )}
                >
                  {isDone ? "✓" : index + 1}
                </span>
                <span
                  className={cn(
                    "text-sm font-medium group-hover:underline underline-offset-4",
                    isCurrent
                      ? "text-foreground"
                      : isDone
                        ? "text-foreground"
                        : "text-muted-foreground",
                  )}
                >
                  {step.label}
                </span>
              </Link>
              {index < steps.length - 1 ? (
                <span
                  aria-hidden
                  className={cn(
                    "hidden h-px w-6 sm:block",
                    isDone ? "bg-primary" : "bg-border",
                  )}
                />
              ) : null}
            </li>
          );
        })}
      </ol>

      {current ? (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">
              Nächster Schritt:
            </span>{" "}
            {current.label}
            <span className="text-muted-foreground">
              {" "}
              · {doneCount}/{steps.length} erledigt
            </span>
          </p>
          <Button asChild size="lg">
            <Link href={current.href}>{current.cta ?? current.label}</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-5 border-t border-border pt-4">
          <p className="text-sm font-semibold text-primary">
            ✓ Alle Schritte erledigt — dein Buch ist fertig.
          </p>
        </div>
      )}
    </section>
  );
}
