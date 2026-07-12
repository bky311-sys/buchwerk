"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/buchwerk/spinner";

type Props = {
  projectId: string;
  // Ordered ids of chapters that still need to be written.
  chapterIds: string[];
  // No research dossier yet → run it (in stages) once up front so the per-chapter
  // writes stay fast and within the function time limit.
  needsResearch: boolean;
  researchStages: number;
};

type Phase = "idle" | "research" | "writing";

export function BatchWrite({
  projectId,
  chapterIds,
  needsResearch,
  researchStages,
}: Props) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [researchStage, setResearchStage] = useState(0);
  const [doneCount, setDoneCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const total = chapterIds.length;
  if (total === 0) return null;

  async function run() {
    if (
      !window.confirm(
        `Alle ${total} offenen Kapitel nacheinander schreiben? Das dauert einige Minuten — lass den Tab so lange offen.`,
      )
    ) {
      return;
    }
    setError(null);
    setDoneCount(0);

    // Research once up front, in stages (each stage a separate request under the
    // time limit), so each chapter write stays fast afterwards.
    if (needsResearch) {
      setPhase("research");
      for (let s = 0; s < researchStages; s++) {
        setResearchStage(s + 1);
        try {
          await fetch(`/api/projekte/${projectId}/research`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ stage: s }),
          });
        } catch {
          // Best-effort — chapters are still written without a dossier.
        }
      }
      router.refresh();
    }

    setPhase("writing");
    for (let i = 0; i < chapterIds.length; i++) {
      try {
        await fetch(`/api/chapters/${chapterIds[i]}/generate`, {
          method: "POST",
        });
      } catch {
        // Dropped/timeout — that chapter's poller + retry handle it; keep going.
      }
      setDoneCount(i + 1);
      router.refresh();
    }

    setPhase("idle");
    router.refresh();
  }

  if (phase !== "idle") {
    return (
      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
        <div className="flex items-center gap-2 text-sm font-medium text-clay-strong">
          <Spinner className="size-4" />
          {phase === "research"
            ? `KI recherchiert dein Thema im Web — Etappe ${researchStage}/${researchStages}…`
            : `Schreibe Kapitel ${Math.min(doneCount + 1, total)} von ${total}…`}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Bitte den Tab offen lassen. Jedes Kapitel dauert ~30 Sek.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {total} offene{total === 1 ? "s" : ""} Kapitel — schreib alle auf
          einmal, statt einzeln zu klicken und zu warten.
        </p>
        <Button type="button" size="lg" onClick={run}>
          Alle {total} Kapitel schreiben
        </Button>
      </div>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
