"use client";

import { useState, type ReactNode } from "react";

// Collapsible chapter card for the writing page: a clickable header (number +
// status + heading) that toggles the body (content + generator). Finished
// chapters start collapsed so the page stays short; chapters that still need
// attention start open.
export function ChapterCollapse({
  number,
  heading,
  badge,
  defaultOpen,
  children,
}: {
  number: number;
  heading: string;
  badge: ReactNode;
  defaultOpen: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <article className="scroll-mt-6 overflow-hidden rounded-2xl border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-start justify-between gap-3 p-6 text-left transition-colors hover:bg-muted/50 sm:p-7"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <span className="font-display text-sm font-bold text-muted-foreground tabular-nums">
              {String(number).padStart(2, "0")}
            </span>
            {badge}
          </div>
          <h2 className="mt-2 font-display text-xl font-semibold tracking-tight">
            {heading}
          </h2>
        </div>
        <span
          className="mt-1 shrink-0 text-sm text-muted-foreground"
          aria-hidden
        >
          {open ? "Einklappen ▲" : "Ausklappen ▼"}
        </span>
      </button>
      {open ? (
        <div className="border-t border-border px-6 pb-6 pt-5 sm:px-7 sm:pb-7">
          {children}
        </div>
      ) : null}
    </article>
  );
}
