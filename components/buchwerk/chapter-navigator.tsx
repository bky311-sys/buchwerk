"use client";

import { useChapterAccordion } from "@/components/buchwerk/chapter-accordion";
import { Spinner } from "@/components/buchwerk/spinner";
import { cn } from "@/lib/utils";

// Kapitel-Navigator fürs Schreib-Cockpit: kompakter Überblick über alle
// Kapitel mit Status-Punkt. Desktop: sticky Seitenleiste; mobil: horizontale
// Chip-Leiste. Klick öffnet das Kapitel im Akkordeon und scrollt hin —
// beantwortet „was ist noch zu tun, was läuft gerade?" ohne Scrollen.

export type NavigatorItem = {
  anchorId: string;
  number: number;
  heading: string;
  state: "done" | "generating" | "draft" | "open" | "error";
};

const DOT_CLASSES: Record<NavigatorItem["state"], string> = {
  done: "bg-primary",
  generating: "bg-clay animate-pulse",
  draft: "bg-clay",
  open: "bg-input",
  error: "bg-destructive",
};

const STATE_LABEL: Record<NavigatorItem["state"], string> = {
  done: "fertig",
  generating: "wird geschrieben",
  draft: "Entwurf",
  open: "offen",
  error: "fehlgeschlagen",
};

export function ChapterNavigator({ items }: { items: NavigatorItem[] }) {
  const accordion = useChapterAccordion();

  function jump(item: NavigatorItem): void {
    accordion?.setOpenId(item.anchorId);
    requestAnimationFrame(() => {
      document
        .getElementById(item.anchorId)
        ?.scrollIntoView({ block: "start", behavior: "smooth" });
    });
  }

  return (
    <nav aria-label="Kapitelübersicht">
      {/* Desktop: vertikale Liste */}
      <ol className="hidden lg:block lg:space-y-1">
        {items.map((item) => (
          <li key={item.anchorId}>
            <button
              type="button"
              onClick={() => jump(item)}
              title={`${item.heading} — ${STATE_LABEL[item.state]}`}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-muted",
                accordion?.openId === item.anchorId
                  ? "bg-muted font-medium text-foreground"
                  : "text-muted-foreground",
              )}
            >
              {item.state === "generating" ? (
                <Spinner className="size-2.5 shrink-0 text-clay-strong" />
              ) : (
                <span
                  className={cn(
                    "size-2.5 shrink-0 rounded-full",
                    DOT_CLASSES[item.state],
                  )}
                  aria-hidden
                />
              )}
              <span className="font-display text-xs font-bold tabular-nums">
                {String(item.number).padStart(2, "0")}
              </span>
              <span className="min-w-0 flex-1 truncate">{item.heading}</span>
            </button>
          </li>
        ))}
      </ol>

      {/* Mobil: horizontale Chip-Leiste */}
      <ol className="flex flex-wrap gap-1.5 lg:hidden">
        {items.map((item) => (
          <li key={item.anchorId}>
            <button
              type="button"
              onClick={() => jump(item)}
              title={`${item.heading} — ${STATE_LABEL[item.state]}`}
              className={cn(
                "flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs font-medium tabular-nums transition-colors",
                accordion?.openId === item.anchorId
                  ? "border-primary bg-primary/5 text-foreground"
                  : "bg-card text-muted-foreground",
              )}
            >
              {item.state === "generating" ? (
                <Spinner className="size-2 text-clay-strong" />
              ) : (
                <span
                  className={cn("size-2 rounded-full", DOT_CLASSES[item.state])}
                  aria-hidden
                />
              )}
              {String(item.number).padStart(2, "0")}
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
