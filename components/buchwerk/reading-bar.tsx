"use client";

import { useEffect, useRef, useState } from "react";

// The reader's status bar: sends the heartbeat AND shows what it earned.
//
// It replaced a silent tracker. That version measured correctly and said
// nothing, so the first real reader read several chapters, saw a book counter
// still at 0 and concluded it was broken. Measuring without telling is a bug.
//
// Why the numbers are public now: hiding the threshold protected nothing. To
// fake this you must simulate interaction every 60 s and 90 % scroll depth, for
// every chapter — that costs the same whether the threshold is secret or not.
// Secrecy only punished honest readers, who had no way to know the page was
// working.
//
// Placement is deliberate: BOTTOM, not top. A meta-analysis over 32 experiments
// found progress indicators backfire when early progress disappoints — top
// placement raised drop-off, bottom placement improved completion. A book
// chapter is exactly the "slow early progress" case.
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
  counted: boolean;
};

function minutes(seconds: number): string {
  if (seconds <= 60) return "unter 1 Min.";
  return `${Math.round(seconds / 60)} Min.`;
}

export function ReadingBar(props: Props) {
  const lastInteraction = useRef(0);
  const maxScroll = useRef(0);

  const [seconds, setSeconds] = useState(props.secondsActive);
  const [reachedEnd, setReachedEnd] = useState(props.reachedEnd);
  const [counted, setCounted] = useState(props.counted);

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
              chapterRead?: boolean;
              secondsActive?: number;
            } | null,
          ) => {
            if (!data) return;
            if (typeof data.secondsActive === "number") {
              setSeconds(data.secondsActive);
            }
            if (data.chapterRead) setCounted(true);
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

  const pct = props.secondsNeeded
    ? Math.min(100, Math.round((seconds / props.secondsNeeded) * 100))
    : 100;

  return (
    <div className="sticky bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center gap-4 px-6 py-3">
        {counted ? (
          <p className="text-sm font-medium text-primary">
            ✓ Dieses Kapitel zählt als gelesen
          </p>
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
              Lesezeit {minutes(seconds)} von {minutes(props.secondsNeeded)}
              {reachedEnd ? " · bis zum Ende ✓" : " · bis zum Ende scrollen"}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
