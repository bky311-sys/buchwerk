"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { trackNicheStartAction } from "@/lib/books/niche-actions";
import type { NicheMarket } from "@/lib/books/niche-pool";

// "Keine Idee?"-Einstieg im Neues-Buch-Formular: kurze Interessen-Abfrage
// (Klick-Chips), dann passende Nischen-Karten aus dem wöchentlich per Cron
// recherchierten Pool. "Dieses Buch starten" befüllt das Formular über die
// URL-Parameter, die die Projekte-Seite ohnehin schon versteht — kein
// KI-Call, keine Wartezeit, kein Kostenrisiko pro Klick.
//
// Nischen mit `market` sind vom täglichen Cron gegen echte Amazon-Zahlen
// validiert (Marktführer-Bewertungen, Titel-Alter, Preisspanne) — die Karten
// zeigen die Zahlen statt reiner LLM-Einschätzung. "schwach" validierte
// Nischen erreichen die UI gar nicht erst.

type Niche = {
  id: string;
  title: string;
  audience: string;
  pitch: string;
  demand: string;
  competition: string;
  interests: string[];
  book_type: string;
  topic_prompt: string;
  market: NicheMarket | null;
};

const SHOWN_STEP = 4;

function ampel(value: string, goodWhen: string): string {
  // Nachfrage: hoch = gut; Konkurrenz: niedrig = gut.
  if (value === goodWhen) return "text-success";
  if (value === "mittel") return "text-clay-strong";
  return "text-muted-foreground";
}

export function NicheFinder({
  niches,
  interests,
}: {
  niches: Niche[];
  interests: readonly string[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [bookType, setBookType] = useState<"alle" | "ratgeber" | "sachbuch">(
    "alle",
  );
  const [shown, setShown] = useState(SHOWN_STEP);

  const matches = useMemo(() => {
    const filtered = niches.filter((n) => {
      if (bookType !== "alle" && n.book_type !== bookType) return false;
      if (picked.size === 0) return true;
      return n.interests.some((t) => picked.has(t));
    });
    // Beste zuerst: validierte Nischen vor unvalidierten (echte Zahlen schlagen
    // Einschätzung), darin "stark" vor "ok"; dann hohe Nachfrage + niedrige
    // Konkurrenz.
    const score = (n: Niche) =>
      (n.market ? (n.market.verdict === "stark" ? 8 : 4) : 0) +
      (n.demand === "hoch" ? 2 : n.demand === "mittel" ? 1 : 0) +
      (n.competition === "niedrig" ? 2 : n.competition === "mittel" ? 1 : 0);
    return [...filtered].sort((a, b) => score(b) - score(a));
  }, [niches, picked, bookType]);

  function toggleInterest(tag: string) {
    const next = new Set(picked);
    if (next.has(tag)) next.delete(tag);
    else next.add(tag);
    setPicked(next);
    setShown(SHOWN_STEP);
  }

  function start(niche: Niche) {
    // Feedback-Loop: Klick zählen (fire-and-forget, blockiert den Start nie).
    void trackNicheStartAction(niche.id);
    const params = new URLSearchParams({
      thema: niche.topic_prompt,
      zielgruppe: niche.audience,
    });
    router.push(`/projekte?${params.toString()}#neu`);
  }

  // Ohne Pool (Cron lief noch nie / Fehler) bleibt das Feature unsichtbar.
  if (!niches.length) return null;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 text-sm font-medium text-primary underline underline-offset-4 hover:text-primary/80"
      >
        Keine Idee? Lass dir Nischen mit echter Nachfrage vorschlagen →
      </button>
    );
  }

  return (
    <div className="mt-4 rounded-2xl border border-primary/25 bg-primary/5 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-base font-semibold tracking-tight">
            Nischen-Vorschläge
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Wöchentlich recherchiert: Themen mit erkennbarer Nachfrage und wenig
            deutscher Konkurrenz. Wähle deine Interessen — oder stöbere einfach.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="shrink-0 text-sm text-muted-foreground hover:text-foreground"
        >
          Schließen ✕
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {interests.map((tag) => {
          const active = picked.has(tag);
          return (
            <button
              key={tag}
              type="button"
              onClick={() => toggleInterest(tag)}
              aria-pressed={active}
              className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              {tag}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        {(
          [
            ["alle", "Alles"],
            ["ratgeber", "Ratgeber"],
            ["sachbuch", "Sachbuch"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setBookType(value)}
            aria-pressed={bookType === value}
            className={`rounded-full px-3 py-1 transition-colors ${
              bookType === value
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {matches.length ? (
        <>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {matches.slice(0, shown).map((niche) => (
              <li
                key={niche.id}
                className="flex flex-col rounded-xl border border-border bg-card p-4"
              >
                <p className="font-display text-sm font-semibold leading-snug">
                  {niche.title}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {niche.audience}
                </p>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-foreground">
                  {niche.market?.begruendung || niche.pitch}
                </p>
                {niche.market ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {[
                      niche.market.marktfuehrer_bewertungen !== null
                        ? `Marktführer ${niche.market.marktfuehrer_bewertungen.toLocaleString("de-DE")} Bew.`
                        : null,
                      niche.market.juengster_titel_jahr !== null
                        ? `neuester Titel ${niche.market.juengster_titel_jahr}`
                        : null,
                      niche.market.preis_spanne,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "Kaum aktuelle deutsche Titel gefunden"}
                  </p>
                ) : null}
                <p className="mt-3 text-xs font-medium">
                  {niche.market ? (
                    <>
                      <span className="text-success">
                        ✓ Amazon-geprüft
                        {niche.market.verdict === "stark"
                          ? " · starke Lücke"
                          : ""}
                      </span>
                      <span className="text-muted-foreground"> · </span>
                    </>
                  ) : null}
                  <span className={ampel(niche.demand, "hoch")}>
                    Nachfrage {niche.demand}
                  </span>
                  <span className="text-muted-foreground"> · </span>
                  <span className={ampel(niche.competition, "niedrig")}>
                    Konkurrenz {niche.competition}
                  </span>
                </p>
                <div className="mt-3">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => start(niche)}
                  >
                    Dieses Buch starten
                  </Button>
                </div>
              </li>
            ))}
          </ul>
          {matches.length > shown ? (
            <div className="mt-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShown((s) => s + SHOWN_STEP)}
              >
                Mehr Vorschläge zeigen ({matches.length - shown} weitere)
              </Button>
            </div>
          ) : null}
        </>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          Für diese Kombination ist gerade nichts im Pool — wähle weniger Filter
          oder schau nächste Woche wieder rein.
        </p>
      )}
    </div>
  );
}
