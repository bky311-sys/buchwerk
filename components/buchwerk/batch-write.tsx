"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/buchwerk/spinner";

// A chapter write is decoupled: the server keeps writing even if the HTTP
// response is dropped (function near the time limit). Abort the client fetch
// after this long so a hung request can't stall the batch — the write still
// lands and the poll below reflects it.
const CHAPTER_FETCH_TIMEOUT_MS = 90_000;

async function fireGenerate(chapterId: string): Promise<void> {
  // 409 = ein anderes Kapitel des Buchs läuft noch (z. B. ein manuell
  // angestoßenes, oder der vorige Batch-Schritt schreibt serverseitig weiter,
  // obwohl sein Response verworfen wurde). Dann warten und erneut versuchen,
  // statt das Kapitel zu überspringen.
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), CHAPTER_FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(`/api/chapters/${chapterId}/generate`, {
        method: "POST",
        signal: controller.signal,
      });
      if (res.status !== 409) return;
    } finally {
      clearTimeout(timer);
    }
    await new Promise((r) => setTimeout(r, 15_000));
  }
}

type Props = {
  projectId: string;
  // Ordered ids of chapters that still need to be written.
  chapterIds: string[];
  // No research dossier yet → run it (in stages) once up front so the per-chapter
  // writes stay fast and within the function time limit.
  needsResearch: boolean;
  researchStages: number;
  // Ein Kapitel läuft gerade (z. B. einzeln angestoßen): Der Sammel-Start ist
  // dann gesperrt — vorher blieb der Button klickbar und lief serverseitig
  // in die 409-Warteschleife (Benjamins Befund 25.08.).
  otherGenerating: boolean;
};

type Phase = "idle" | "research" | "writing";

export function BatchWrite({
  projectId,
  chapterIds,
  needsResearch,
  researchStages,
  otherGenerating,
}: Props) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [researchStage, setResearchStage] = useState(0);
  const [doneCount, setDoneCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // While the batch runs, poll the server state on an interval so the progress
  // (and the chapter list) reflect the DB truth even if a chapter's fetch hangs
  // or its response is dropped — the write lands server-side regardless.
  useEffect(() => {
    if (phase === "idle") return;
    const t = setInterval(() => router.refresh(), 4000);
    return () => clearInterval(t);
  }, [phase, router]);

  // Der Batch läuft clientseitig Kapitel für Kapitel — Tab zu = Lauf bricht
  // kommentarlos ab. Beim Verlassen deshalb warnen (Schreib-Cockpit 25.08.).
  useEffect(() => {
    if (phase === "idle") return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [phase]);

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
        await fireGenerate(chapterIds[i]);
      } catch {
        // Dropped/aborted/timeout — that chapter's poller + retry handle it; the
        // write may still land server-side. Keep going.
      }
      setDoneCount(i + 1);
      router.refresh();
    }

    setPhase("idle");
    router.refresh();
  }

  // Kompakte Darstellung für die Sticky-Leiste des Schreib-Cockpits: nur der
  // Button (bzw. sein Laufzustand), der erklärende Kontext steht in der Leiste.
  if (phase !== "idle") {
    return (
      <div className="flex flex-col items-end gap-1">
        <Button type="button" disabled>
          <Spinner className="size-4" />
          {phase === "research"
            ? `Recherche ${researchStage}/${researchStages}…`
            : `Schreibt ${Math.min(doneCount + 1, total)}/${total}…`}
        </Button>
        <span className="text-xs text-muted-foreground">
          Tab bitte offen lassen
        </span>
      </div>
    );
  }

  if (otherGenerating) {
    return (
      <Button type="button" disabled title="Gerade wird ein Kapitel geschrieben — der Sammel-Lauf ist so lange gesperrt.">
        <Spinner className="size-4" />
        Kapitel läuft…
      </Button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button type="button" onClick={run}>
        Alle {total} Kapitel schreiben
      </Button>
      {error ? (
        <span role="alert" className="text-xs text-destructive">
          {error}
        </span>
      ) : null}
    </div>
  );
}
