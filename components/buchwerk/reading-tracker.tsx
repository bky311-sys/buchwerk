"use client";

import { useEffect, useRef } from "react";

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

export function ReadingTracker({ chapterId }: { chapterId: string }) {
  const lastInteraction = useRef<number>(0);
  const maxScroll = useRef<number>(0);

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
      }).catch(() => {
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

  return null;
}
