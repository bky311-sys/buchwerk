"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

// The reader's status bar: sends the heartbeat, then hands the actual "das
// zählt als gelesen"-Entscheidung an den Leser selbst.
//
// Produktentscheidung mit Benjamin (05.08.): Ehrliches Bewerten ist die
// Verantwortung des Lesers, nicht unserer Stoppuhr. Die Messung (Scrolltiefe +
// ein niedriger, flacher Zeit-Boden) bleibt als leichter technischer Unterbau
// bestehen — Anhang Nr. 23b UWG verlangt "angemessene" Verifikation, eine reine
// Selbstauskunft ohne jede Prüfung wäre das nicht. Aber sobald die Schwelle
// erreicht ist, zählt das Kapitel erst, wenn der Leser aktiv auf "Kapitel als
// gelesen markieren" klickt — nicht automatisch im Hintergrund.
//
// Warum die Zahlen weiterhin sichtbar sind: hiding the threshold protected
// nothing. Secrecy only punished honest readers, who had no way to know the
// page was working.
//
// Placement is deliberate: BOTTOM, not top. A meta-analysis over 32 experiments
// found progress indicators backfire when early progress disappoints — top
// placement raised drop-off, bottom placement improved completion.
//
// A beat is only sent when the tab is visible AND the reader interacted within
// IDLE_MS. Wall-clock time would make an open background tab a valid read (the
// Medium read-ratio failure). The server caps what each beat is worth, so
// replaying the request buys nothing (app/api/lesen/heartbeat/route.ts).

const BEAT_MS = 15_000;
const IDLE_MS = 60_000;

type Props = {
  chapterId: string;
  secondsActive: number;
  secondsNeeded: number;
  reachedEnd: boolean;
  eligible: boolean;
  confirmed: boolean;
};

export function ReadingBar(props: Props) {
  const lastInteraction = useRef(0);
  const maxScroll = useRef(0);

  const [seconds, setSeconds] = useState(props.secondsActive);
  const [reachedEnd, setReachedEnd] = useState(props.reachedEnd);
  const [eligible, setEligible] = useState(props.eligible);
  const [confirmed, setConfirmed] = useState(props.confirmed);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    lastInteraction.current = Date.now();

    const touch = () => {
      lastInteraction.current = Date.now();
    };

    const measureScroll = () => {
      touch();
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      // A chapter shorter than the viewport needs no scrolling — count it as
      // fully reached, otherwise it could never be marked read.
      const depth =
        scrollable <= 0
          ? 1
          : Math.min(1, (window.scrollY + window.innerHeight) / doc.scrollHeight);
      if (depth > maxScroll.current) {
        maxScroll.current = depth;
        if (depth >= 0.9) setReachedEnd(true);
      }
    };

    measureScroll();
    window.addEventListener("scroll", measureScroll, { passive: true });
    window.addEventListener("wheel", touch, { passive: true });
    window.addEventListener("keydown", touch);
    window.addEventListener("pointerdown", touch);

    const timer = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastInteraction.current > IDLE_MS) return;

      void fetch("/api/lesen/heartbeat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          chapterId: props.chapterId,
          scroll: maxScroll.current,
        }),
        keepalive: true,
      })
        .then((r) => (r.ok ? r.json() : null))
        .then(
          (
            data: {
              eligible?: boolean;
              secondsActive?: number;
            } | null,
          ) => {
            if (!data) return;
            if (typeof data.secondsActive === "number") {
              setSeconds(data.secondsActive);
            }
            if (data.eligible) setEligible(true);
          },
        )
        .catch(() => {
          // Progress is best-effort: a dropped beat costs 15 s of credit, never
          // the page.
        });
    }, BEAT_MS);

    return () => {
      clearInterval(timer);
      window.removeEventListener("scroll", measureScroll);
      window.removeEventListener("wheel", touch);
      window.removeEventListener("keydown", touch);
      window.removeEventListener("pointerdown", touch);
    };
  }, [props.chapterId]);

  function confirm() {
    setConfirming(true);
    setError(null);
    fetch("/api/lesen/confirm", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chapterId: props.chapterId }),
    })
      .then(async (r) => {
        if (!r.ok) {
          const data = (await r.json().catch(() => null)) as {
            error?: string;
          } | null;
          setError(data?.error ?? "Konnte nicht bestätigt werden.");
          return;
        }
        setConfirmed(true);
      })
      .catch(() => setError("Konnte nicht bestätigt werden — versuch's noch mal."))
      .finally(() => setConfirming(false));
  }

  const pct = props.secondsNeeded
    ? Math.min(100, Math.round((seconds / props.secondsNeeded) * 100))
    : 100;

  return (
    <div className="sticky bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center gap-4 px-6 py-3">
        {confirmed ? (
          <p className="text-sm font-medium text-primary">
            ✓ Dieses Kapitel zählt als gelesen
          </p>
        ) : eligible ? (
          <div className="flex flex-1 flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              Fertig gelesen?
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                disabled={confirming}
                onClick={confirm}
              >
                {confirming ? "…" : "Kapitel als gelesen markieren"}
              </Button>
              {error ? (
                <span className="text-xs text-destructive">{error}</span>
              ) : null}
            </div>
          </div>
        ) : (
          <>
            <div className="min-w-0 flex-1">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
            <p className="shrink-0 text-xs text-muted-foreground">
              {reachedEnd ? "Bis zum Ende ✓" : "Bis zum Ende scrollen"}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
