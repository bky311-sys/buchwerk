"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

// Klick-Erklärung zum Punkte-Badge: woher die Punkte kommen und wofür sie
// gut sind. Benjamins Anschluss-Feedback (05.08.) — der Badge allein war
// noch nicht selbsterklärend, ein Klick sprang nur direkt in den Buchshop.
//
// Eigenständige Client Component (Popover-State), weil server-only-Konstanten
// (lib/shop/points.ts) nicht in Client Components importiert werden dürfen —
// pointsPerReview kommt daher als Prop von der Server-Komponente PointsBadge.
export function PointsPopover({
  points,
  pointsPerReview,
}: {
  points: number;
  pointsPerReview: number;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={points === 0 ? "Punkte sammeln" : undefined}
        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted/70"
      >
        <span aria-hidden>★</span>
        {points === 0 ? (
          // Bei 0 wirkt „★ 0 Punkte" wie ein leerer Kontostand — als Einladung
          // formuliert klickt man eher (Review-Fund 11.08.). Mobil nur der
          // Stern: „Punkte sammeln" (+50px) sprengte die 375px-Headerzeile.
          <span className="hidden sm:inline">Punkte sammeln</span>
        ) : (
          <>
            <span className="tabular-nums">{points}</span>
            <span className="hidden sm:inline">Punkte</span>
          </>
        )}
      </button>

      {open ? (
        <div
          role="dialog"
          className="absolute right-0 z-50 mt-2 w-72 rounded-2xl border border-border bg-card p-4 shadow-lg"
        >
          <p className="font-display text-sm font-semibold text-foreground">
            {points === 0
              ? "So sammelst du Punkte"
              : `Du hast ${points} ${points === 1 ? "Punkt" : "Punkte"}`}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Mit Punkten bezahlst du die Arbeit an deinem Buch: Kapitel
            schreiben, Qualitätsbericht, automatische Überarbeitung, Cover und
            Listing. Sie stecken im Kauf und im Abo — und du verdienst sie
            dazu.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {pointsPerReview} Punkte gibt es für jede Bewertung eines Buchs,
            das du im Buchshop gelesen hast — immer gleich viele, unabhängig
            von der Sternezahl und davon, ob der Autor die Bewertung
            veröffentlicht.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            <strong className="font-semibold text-foreground">
              Dein fertiges Buch kannst du immer ohne Punkte exportieren
            </strong>{" "}
            — PDF, EPUB, Cover und Listing-Daten bleiben kostenlos.
          </p>
          <Link
            href="/buchshop"
            onClick={() => setOpen(false)}
            className="mt-3 inline-block text-sm font-semibold text-primary underline underline-offset-4"
          >
            Bücher zum Bewerten finden →
          </Link>
        </div>
      ) : null}
    </div>
  );
}
