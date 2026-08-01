"use client";

import { useEffect, useState } from "react";

// Die 15 KDP-Schritte als abhakbare, einklappbare Checkliste. Der KDP-Upload
// dauert real oft mehrere Sitzungen (Amazon-Review bis 72 h) — die Haken
// merken sich per localStorage, wie weit man war, und die Wand aus Schritten
// lässt sich zuklappen, wenn man sie (noch) nicht braucht (UX-Review P2).
// localStorage statt DB mit Absicht: reiner Lese-Komfort, kein Datenverlust,
// keine Migration.

const GROUPS: { title: string; steps: string[] }[] = [
  {
    title: "Anlegen",
    steps: [
      "Bei kdp.amazon.com anmelden (kostenloses Konto), dann „+ Neuen Titel erstellen“ → eBook wählen (Taschenbuch später genauso).",
    ],
  },
  {
    title: "Reiter „Details des Kindle eBooks“",
    steps: [
      "Sprache: Deutsch.",
      "Buchtitel und Untertitel aus deinen KDP-Texten einfügen.",
      "Autor: Vor- und Nachname getrennt eintragen (Amazon hat zwei Felder).",
      "Beschreibung: den Klappentext aus den KDP-Texten einfügen.",
      "Veröffentlichungsrechte: „Ich bin Inhaber des Urheberrechts …“.",
      "Primäres Publikum: sexuell explizit → Nein; Lesealter leer lassen.",
      "Kategorien: die 3 Kategorien aus deinen KDP-Texten im Kategorie-Picker auswählen (die jeweils passendste Entsprechung).",
      "Stichwörter: die 7 Keywords aus deinen KDP-Texten eintragen.",
    ],
  },
  {
    title: "Reiter „Inhalt des Kindle eBooks“",
    steps: [
      "Manuskript hochladen: EPUB für das eBook (reflowt sauber am Kindle).",
      "Cover: „Bereits vorhandenes Cover hochladen“ → dein Cover-Bild als JPG (KDP nimmt fürs Cover kein PDF).",
      "KI-generierter Inhalt: „Ja“ angeben — Amazon verlangt diese Kennzeichnung.",
    ],
  },
  {
    title: "Nur fürs Taschenbuch (Print)",
    steps: [
      "Als Format „5,50 × 8,50 Zoll (14,0 × 21,6 cm)“ wählen — genau darauf ist die Manuskript-PDF gesetzt.",
      "Als Buchinhalt die Manuskript-PDF hochladen (nicht die EPUB).",
    ],
  },
  {
    title: "Reiter „Preise“",
    steps: [
      "Preis festlegen (Empfehlung aus deinen KDP-Texten) und veröffentlichen. Fertig — nach bis zu 72 h ist dein Buch live.",
    ],
  },
];

const TOTAL_STEPS = GROUPS.reduce((sum, g) => sum + g.steps.length, 0);

// Durchgehende Nummerierung einmal beim Modul-Load — nicht im Render (dort
// verbietet der Hooks-Linter Reassignments zu Recht).
const NUMBERED_GROUPS = (() => {
  let n = 0;
  return GROUPS.map((group) => ({
    title: group.title,
    steps: group.steps.map((step) => ({ step, index: ++n })),
  }));
})();

export function PublishChecklist({ projectId }: { projectId: string }) {
  const openKey = `bw-kdp-guide-open-${projectId}`;
  const doneKey = `bw-kdp-guide-done-${projectId}`;

  const [open, setOpen] = useState(true);
  const [done, setDone] = useState<Set<number>>(new Set());

  // localStorage erst nach dem Mount lesen (SSR kennt es nicht).
  useEffect(() => {
    try {
      const storedOpen = window.localStorage.getItem(openKey);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- einmalige Übernahme von localStorage nach dem Mount, kein Kaskaden-Risiko
      if (storedOpen !== null) setOpen(storedOpen === "1");
      const storedDone = window.localStorage.getItem(doneKey);
      if (storedDone) {
        setDone(new Set(JSON.parse(storedDone) as number[]));
      }
    } catch {
      // localStorage gesperrt — Checkliste funktioniert trotzdem, nur ohne Merken
    }
  }, [openKey, doneKey]);

  function toggleOpen() {
    const next = !open;
    setOpen(next);
    try {
      window.localStorage.setItem(openKey, next ? "1" : "0");
    } catch {
      // ignorieren
    }
  }

  function toggleStep(index: number) {
    const next = new Set(done);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    setDone(next);
    try {
      window.localStorage.setItem(doneKey, JSON.stringify([...next]));
    } catch {
      // ignorieren
    }
  }

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={toggleOpen}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-muted/50 px-4 py-3 text-left transition-colors hover:bg-muted"
      >
        <span className="text-sm font-semibold text-foreground">
          Schritt-für-Schritt-Anleitung
          <span className="ml-2 font-normal text-muted-foreground tabular-nums">
            {done.size}/{TOTAL_STEPS} erledigt
          </span>
        </span>
        <span aria-hidden className="text-sm text-muted-foreground">
          {open ? "Ausblenden ▲" : "Anzeigen ▼"}
        </span>
      </button>

      {open ? (
        <div className="mt-4 space-y-5">
          {NUMBERED_GROUPS.map((group) => (
            <div key={group.title}>
              <p className="text-sm font-semibold text-foreground">
                {group.title}
              </p>
              <ol className="mt-2 space-y-2.5">
                {group.steps.map(({ step, index }) => {
                  const checked = done.has(index);
                  return (
                    <li key={step}>
                      <label className="flex cursor-pointer gap-3 text-sm leading-relaxed">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleStep(index)}
                          className="peer sr-only"
                        />
                        <span
                          aria-hidden
                          className={`font-display flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums transition-colors ${
                            checked
                              ? "bg-primary text-primary-foreground"
                              : "bg-primary/12 text-primary"
                          }`}
                        >
                          {checked ? "✓" : index}
                        </span>
                        <span
                          className={
                            checked
                              ? "text-muted-foreground line-through decoration-border"
                              : "text-foreground"
                          }
                        >
                          {step}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ol>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
