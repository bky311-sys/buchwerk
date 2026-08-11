"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";

// Burger-Menü für schmale Screens. Grund (Benjamins Fund, 11.08.): der Header
// war eingeloggt ~480px breit (Logo + Punkte + „Meine Projekte" + „Abmelden"
// [+ Admin]) — auf 375px-Geräten lief er zwangsläufig über. Muster jetzt:
// mobil bleiben Logo, Punkte-Badge und der eine Primär-CTA sichtbar, alles
// Sekundäre wandert hierher. Ab `sm` ist das Menü weg und die Einzel-Buttons
// erscheinen wie bisher.
//
// `children` ist ein Slot für Server-gerenderte Einträge (z. B. die
// Abmelden-<form> mit Server Action) — so bleibt diese Komponente frei von
// server-only-Imports.
export function MobileMenu({
  links,
  children,
}: {
  links: { href: string; label: string }[];
  children?: ReactNode;
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
    <div ref={ref} className="relative sm:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Menü"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-muted"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          className="size-5"
          aria-hidden="true"
        >
          {open ? (
            <>
              <path d="M6 6l12 12" />
              <path d="M18 6l-12 12" />
            </>
          ) : (
            <>
              <path d="M4 7h16" />
              <path d="M4 12h16" />
              <path d="M4 17h16" />
            </>
          )}
        </svg>
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-56 rounded-2xl border border-border bg-card p-2 shadow-lg">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block rounded-xl px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              {link.label}
            </Link>
          ))}
          {children ? (
            <div className="mt-1 border-t border-border pt-1">{children}</div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
