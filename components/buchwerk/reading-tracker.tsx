"use client";

import { useEffect, useRef, useState } from "react";

// Sends a heartbeat while the reader is actually reading this chapter.
//
// "Actually" is doing work here, and it is the whole point. Wall-clock time is
// worthless as evidence — an open tab in a background window would pass any
// timer (this is why Medium's 30-second read ratio proves nothing). So a beat is
// only sent when BOTH hold:
//   1. the tab is visible (document.visibilityState), and
//   2. the reader interacted within IDLE_MS (scroll, key, pointer, wheel).
//
// This is not proof and is not sold as proof: a script can still fake it. It
// makes faking cost more effort than reading, which is all any client-side
// signal can honestly claim. The server caps what each beat is worth, so
// replaying beats faster buys nothing (see app/api/lesen/heartbeat/route.ts).

const BEAT_MS = 15_000;
const IDLE_MS = 60_000;

export function ReadingTracker({
  chapterId,
  alreadyRead,
}: {
  chapterId: string;
  alreadyRead: boolean;
}) {
  const lastInteraction = useRef<number>(0);
  const maxScroll = useRef<number>(0);
  // Live state of THIS chapter. Without it the only feedback is a book-level
  // counter that stays at 0 for several minutes — the first real reader read
  // four chapters, saw "0 von 10" and concluded the tracking was broken. It
  // wasn't; it just never said anything.
  // Seeded from the server. The caller remounts this per chapter (key), so no
  // effect is needed to resync when the chapter changes.
  const [chapterRead, setChapterRead] = useState(alreadyRead);
  const [beat, setBeat] = useState(false);

  useEffect(() => {
    // Initialised here rather than in useRef so the value comes from the client
    // clock after mount, never from a server render.
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
        scrollable <= 0 ? 1 : Math.min(1, (window.scrollY + window.innerHeight) / doc.scrollHeight);
      if (depth > maxScroll.current) maxScroll.current = depth;
    };

    measureScroll();
    window.addEventListener("scroll", measureScroll, { passive: true });
    window.addEventListener("wheel", touch, { passive: true });
    window.addEventListener("keydown", touch);
    window.addEventListener("pointerdown", touch);

    const beat = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastInteraction.current > IDLE_MS) return;

      // keepalive so a beat still lands if the reader navigates away mid-flight.
      void fetch("/api/lesen/heartbeat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ chapterId, scroll: maxScroll.current }),
        keepalive: true,
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((data: { chapterRead?: boolean } | null) => {
          if (!data) return;
          setBeat(true);
          setTimeout(() => setBeat(false), 1200);
          if (data.chapterRead) setChapterRead(true);
        })
        .catch(() => {
          // Progress is best-effort: a dropped beat costs the reader 15 s of
          // credit, never the page.
        });
    }, BEAT_MS);

    return () => {
      clearInterval(beat);
      window.removeEventListener("scroll", measureScroll);
      window.removeEventListener("wheel", touch);
      window.removeEventListener("keydown", touch);
      window.removeEventListener("pointerdown", touch);
    };
  }, [chapterId]);

  // Deliberately no countdown ("noch 90 Sekunden"). That would just teach people
  // what to wait out. This says only whether the chapter counts yet — enough for
  // an honest reader to trust the page, useless as a cheat sheet.
  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 rounded-full border border-border bg-card px-4 py-2 text-xs shadow-sm"
    >
      {chapterRead ? (
        <span className="font-medium text-foreground">
          ✓ Kapitel gelesen
        </span>
      ) : (
        <span className="flex items-center gap-2 text-muted-foreground">
          <span
            className={`inline-block h-1.5 w-1.5 rounded-full bg-primary transition-opacity ${
              beat ? "opacity-100" : "opacity-30"
            }`}
          />
          Lesen wird gezählt
        </span>
      )}
    </div>
  );
}
