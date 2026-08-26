"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useChapterAccordion } from "@/components/buchwerk/chapter-accordion";

// Collapsible chapter card for the writing page: a clickable header (number +
// status + heading) that toggles the body (content + generator).
//
// Innerhalb eines <ChapterAccordion> ist die Karte fremdgesteuert (exklusiv:
// höchstens eine offen — Schreib-Cockpit); ohne Provider verhält sie sich wie
// bisher mit lokalem Zustand.
//
// `anchorId` macht die Karte per #hash ansteuerbar (Deep-Link „Kapitel lesen"
// aus dem Hub): passt der Hash, klappt sie auf und scrollt in den Blick.
export function ChapterCollapse({
  number,
  heading,
  badge,
  defaultOpen,
  anchorId,
  children,
}: {
  number: number;
  heading: string;
  badge: ReactNode;
  defaultOpen: boolean;
  anchorId?: string;
  children: ReactNode;
}) {
  const accordion = useChapterAccordion();
  const [localOpen, setLocalOpen] = useState(defaultOpen);
  const ref = useRef<HTMLElement | null>(null);

  const controlled = Boolean(accordion && anchorId);
  const open = controlled ? accordion!.openId === anchorId : localOpen;

  function setOpen(next: boolean): void {
    if (controlled) accordion!.setOpenId(next ? anchorId! : null);
    else setLocalOpen(next);
  }

  useEffect(() => {
    if (!anchorId || window.location.hash !== `#${anchorId}`) return;
    // Einmalige Hash-Übernahme nach dem Mount (SSR kennt den Hash nicht).
    if (accordion) {
      accordion.setOpenId(anchorId);
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- s. o.
      setLocalOpen(true);
    }
    // Nach dem Aufklappen scrollen, damit die Zielposition stimmt.
    requestAnimationFrame(() => {
      ref.current?.scrollIntoView({ block: "start" });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- nur beim Mount
  }, [anchorId]);

  return (
    <article
      id={anchorId}
      ref={ref}
      className="scroll-mt-24 overflow-hidden rounded-2xl border border-border bg-card"
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-start justify-between gap-3 p-5 text-left transition-colors hover:bg-muted/50 sm:p-6"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <span className="font-display text-sm font-bold text-muted-foreground tabular-nums">
              {String(number).padStart(2, "0")}
            </span>
            {badge}
          </div>
          <h2
            className={
              open
                ? "mt-2 font-display text-xl font-semibold tracking-tight"
                : "mt-1.5 font-display text-base font-semibold tracking-tight"
            }
          >
            {heading}
          </h2>
        </div>
        <span
          className="mt-1 shrink-0 text-sm text-muted-foreground"
          aria-hidden
        >
          {open ? "▲" : "▼"}
        </span>
      </button>
      {open ? (
        <div className="border-t border-border px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
          {children}
        </div>
      ) : null}
    </article>
  );
}
