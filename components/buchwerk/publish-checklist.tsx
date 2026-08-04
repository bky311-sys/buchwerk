"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// Die 15 KDP-Schritte als abhakbare, einklappbare Checkliste — und zwar
// SELBSTVERSORGEND: Jeder Schritt, der Daten braucht, zeigt den konkreten Wert
// direkt mit Kopieren-Button an (Benjamins Anforderung: „maximal einfach",
// kein Hin- und Herspringen zur KDP-Seite beim Amazon-Upload).
// Haken + Aufklapp-Zustand merken sich per localStorage pro Projekt.

export type ChecklistData = {
  title: string;
  subtitle: string;
  author: string;
  description: string;
  keywords: string[];
  categories: string[];
  priceEur: number | null;
  epubHref: string;
  pdfHref: string;
  coverDownloadUrl: string | null;
  manuscriptReady: boolean;
  kdpHref: string;
  coverHref: string;
};

type Slot =
  | "titleSubtitle"
  | "author"
  | "description"
  | "categories"
  | "keywords"
  | "epub"
  | "cover"
  | "pdf"
  | "price";

type Step = { text: string; slot?: Slot };

const GROUPS: { title: string; steps: Step[] }[] = [
  {
    title: "Anlegen",
    steps: [
      {
        text: "Bei kdp.amazon.com anmelden (kostenloses Konto), dann „+ Neuen Titel erstellen“ → eBook wählen (Taschenbuch später genauso).",
      },
    ],
  },
  {
    title: "Reiter „Details des Kindle eBooks“",
    steps: [
      { text: "Sprache: Deutsch." },
      { text: "Buchtitel und Untertitel einfügen:", slot: "titleSubtitle" },
      {
        text: "Autor: Vor- und Nachname getrennt eintragen (Amazon hat zwei Felder).",
        slot: "author",
      },
      { text: "Beschreibung: den Klappentext einfügen.", slot: "description" },
      { text: "Veröffentlichungsrechte: „Ich bin Inhaber des Urheberrechts …“." },
      { text: "Primäres Publikum: sexuell explizit → Nein; Lesealter leer lassen." },
      {
        text: "Kategorien: diese 3 im Kategorie-Picker auswählen (die jeweils passendste Entsprechung):",
        slot: "categories",
      },
      { text: "Stichwörter: diese 7 Keywords eintragen (Klick kopiert):", slot: "keywords" },
    ],
  },
  {
    title: "Reiter „Inhalt des Kindle eBooks“",
    steps: [
      {
        text: "Manuskript hochladen: EPUB für das eBook (reflowt sauber am Kindle).",
        slot: "epub",
      },
      {
        text: "Cover: „Bereits vorhandenes Cover hochladen“ → dein Cover-Bild als JPG (KDP nimmt fürs Cover kein PDF).",
        slot: "cover",
      },
      { text: "KI-generierter Inhalt: „Ja“ angeben — Amazon verlangt diese Kennzeichnung." },
    ],
  },
  {
    title: "Nur fürs Taschenbuch (Print)",
    steps: [
      {
        text: "Als Format „5,50 × 8,50 Zoll (14,0 × 21,6 cm)“ wählen — genau darauf ist die Manuskript-PDF gesetzt.",
      },
      {
        text: "Als Buchinhalt die Manuskript-PDF hochladen (nicht die EPUB).",
        slot: "pdf",
      },
    ],
  },
  {
    title: "Reiter „Preise“",
    steps: [
      {
        text: "Preis festlegen und veröffentlichen. Fertig — nach bis zu 72 h ist dein Buch live.",
        slot: "price",
      },
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
    steps: group.steps.map((step) => ({ ...step, index: ++n })),
  }));
})();

function useCopy(): [string | null, (key: string, text: string) => void] {
  const [copied, setCopied] = useState<string | null>(null);
  function copy(key: string, text: string) {
    void navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(key);
        window.setTimeout(() => setCopied((c) => (c === key ? null : c)), 1500);
      })
      .catch(() => {
        // Zwischenablage gesperrt — dann eben manuell markieren
      });
  }
  return [copied, copy];
}

// Eine Zeile Wert + Kopieren. Der Wert steht sichtbar da (kein Blindflug),
// lange Texte werden gekürzt angezeigt, kopiert wird immer der volle Text.
function CopyRow({
  label,
  value,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="truncate text-sm text-foreground" title={value}>
          {value}
        </p>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="shrink-0"
        onClick={onCopy}
      >
        {copied ? "Kopiert ✓" : "Kopieren"}
      </Button>
    </div>
  );
}

function MissingHint({ href, label }: { href: string; label: string }) {
  return (
    <p className="rounded-lg border border-dashed border-border px-3 py-2 text-sm text-muted-foreground">
      Noch nicht vorhanden —{" "}
      <Link
        href={href}
        className="font-medium text-primary underline underline-offset-2"
      >
        {label}
      </Link>
      .
    </p>
  );
}

function euro(price: number): string {
  return price.toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function PublishChecklist({
  projectId,
  data,
}: {
  projectId: string;
  data: ChecklistData;
}) {
  const openKey = `bw-kdp-guide-open-${projectId}`;
  const doneKey = `bw-kdp-guide-done-${projectId}`;

  const [open, setOpen] = useState(true);
  const [done, setDone] = useState<Set<number>>(new Set());
  const [copied, copy] = useCopy();

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

  function slotContent(slot: Slot) {
    switch (slot) {
      case "titleSubtitle":
        if (!data.title.trim())
          return <MissingHint href={data.kdpHref} label="KDP-Texte erstellen" />;
        return (
          <div className="space-y-2">
            <CopyRow
              label="Titel"
              value={data.title}
              copied={copied === "title"}
              onCopy={() => copy("title", data.title)}
            />
            {data.subtitle.trim() ? (
              <CopyRow
                label="Untertitel"
                value={data.subtitle}
                copied={copied === "subtitle"}
                onCopy={() => copy("subtitle", data.subtitle)}
              />
            ) : null}
          </div>
        );
      case "author":
        if (!data.author.trim())
          return (
            <MissingHint href={data.coverHref} label="Autor im Cover-Schritt eintragen" />
          );
        return (
          <CopyRow
            label="Autor"
            value={data.author}
            copied={copied === "author"}
            onCopy={() => copy("author", data.author)}
          />
        );
      case "description":
        if (!data.description.trim())
          return <MissingHint href={data.kdpHref} label="KDP-Texte erstellen" />;
        return (
          <CopyRow
            label="Klappentext"
            value={data.description}
            copied={copied === "description"}
            onCopy={() => copy("description", data.description)}
          />
        );
      case "categories":
        if (!data.categories.length)
          return <MissingHint href={data.kdpHref} label="KDP-Texte erstellen" />;
        return (
          <div className="space-y-2">
            {data.categories.map((c, i) => (
              <CopyRow
                key={c}
                label={`Kategorie ${i + 1}`}
                value={c}
                copied={copied === `cat-${i}`}
                onCopy={() => copy(`cat-${i}`, c)}
              />
            ))}
          </div>
        );
      case "keywords":
        if (!data.keywords.length)
          return <MissingHint href={data.kdpHref} label="KDP-Texte erstellen" />;
        return (
          <div className="flex flex-wrap gap-2">
            {data.keywords.map((k, i) => (
              <button
                key={k}
                type="button"
                onClick={() => copy(`kw-${i}`, k)}
                className="rounded-full border border-border bg-card px-3 py-1.5 text-sm text-foreground transition-colors hover:border-primary/50 hover:bg-muted"
              >
                {copied === `kw-${i}` ? "Kopiert ✓" : k}
              </button>
            ))}
          </div>
        );
      case "epub":
        if (!data.manuscriptReady)
          return (
            <MissingHint
              href={data.kdpHref.replace("/kdp", "/veroeffentlichen")}
              label="erst Kapitel fertigstellen + Impressum ausfüllen"
            />
          );
        return (
          <Button asChild variant="outline" size="sm">
            <a href={data.epubHref} download>
              ⬇ Manuskript-EPUB herunterladen
            </a>
          </Button>
        );
      case "pdf":
        if (!data.manuscriptReady) return null;
        return (
          <Button asChild variant="outline" size="sm">
            <a href={data.pdfHref} download>
              ⬇ Manuskript-PDF herunterladen
            </a>
          </Button>
        );
      case "cover":
        if (!data.coverDownloadUrl)
          return (
            <MissingHint href={data.coverHref} label="Cover im Cover-Schritt erstellen" />
          );
        return (
          <Button asChild variant="outline" size="sm">
            <a href={data.coverDownloadUrl} download>
              ⬇ Cover-Bild (JPG) herunterladen
            </a>
          </Button>
        );
      case "price": {
        if (data.priceEur == null)
          return <MissingHint href={data.kdpHref} label="KDP-Texte erstellen" />;
        const formatted = euro(data.priceEur);
        return (
          <CopyRow
            label="Preisempfehlung (EUR)"
            value={formatted}
            copied={copied === "price"}
            onCopy={() => copy("price", formatted)}
          />
        );
      }
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
              <ol className="mt-2 space-y-3">
                {group.steps.map(({ text, slot, index }) => {
                  const checked = done.has(index);
                  return (
                    <li key={text}>
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
                          {text}
                        </span>
                      </label>
                      {slot ? (
                        <div className="mt-2 ml-9">{slotContent(slot)}</div>
                      ) : null}
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
