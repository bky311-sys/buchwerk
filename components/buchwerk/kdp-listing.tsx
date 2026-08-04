"use client";

import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/buchwerk/spinner";
import { updateListingAction } from "@/lib/books/listing-actions";

type Listing = {
  title: string | null;
  subtitle: string | null;
  description: string | null;
  keywords: string[] | null;
  categories: string[] | null;
  price_eur: number | null;
  price_note: string | null;
  updated_at: string | null;
};

const TEXTAREA_CLASS =
  "flex w-full rounded-xl border border-input bg-muted px-4 py-3 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          // clipboard not available — ignore
        }
      }}
    >
      {copied ? "Kopiert ✓" : "Kopieren"}
    </Button>
  );
}

function Field({
  label,
  copyText,
  children,
}: {
  label: string;
  copyText: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <Label>{label}</Label>
        <CopyButton text={copyText} />
      </div>
      {children}
    </div>
  );
}

export function KdpListing({
  projectId,
  listing,
}: {
  projectId: string;
  listing: Listing | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [busyAction, setBusyAction] = useState<"generate" | "save" | null>(null);
  const generating = busyAction === "generate";
  const busy = isPending || generating;
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [title, setTitle] = useState(listing?.title ?? "");
  const [subtitle, setSubtitle] = useState(listing?.subtitle ?? "");
  const [description, setDescription] = useState(listing?.description ?? "");
  const [keywords, setKeywords] = useState((listing?.keywords ?? []).join("\n"));
  const [categories, setCategories] = useState(
    (listing?.categories ?? []).join("\n"),
  );
  const [price, setPrice] = useState(
    listing?.price_eur != null ? String(listing.price_eur) : "",
  );

  // Adopt fresh values whenever the server sends a new listing version (after a
  // (re)generation or save). useState only seeds on mount, so without this the
  // form would keep showing the old text after router.refresh(). This is the
  // documented "adjust state while rendering" pattern (guarded so it runs only
  // when the row actually changed), which preserves the "saved" hint that a
  // key-based remount would clear.
  const [seenUpdatedAt, setSeenUpdatedAt] = useState(listing?.updated_at ?? null);
  if ((listing?.updated_at ?? null) !== seenUpdatedAt) {
    setSeenUpdatedAt(listing?.updated_at ?? null);
    setTitle(listing?.title ?? "");
    setSubtitle(listing?.subtitle ?? "");
    setDescription(listing?.description ?? "");
    setKeywords((listing?.keywords ?? []).join("\n"));
    setCategories((listing?.categories ?? []).join("\n"));
    setPrice(listing?.price_eur != null ? String(listing.price_eur) : "");
  }

  // Trigger+Poll statt blockierender Action (letzter langer Flow, UX-Review):
  // Der fetch stößt die API-Route an, parallel refresht ein Intervall die Seite.
  // Reißt die Verbindung ab, schreibt der Server trotzdem fertig — der Poll
  // holt das Ergebnis, und der Effekt unten beendet den Spinner, sobald eine
  // neue Listing-Version (updated_at) angekommen ist.
  const pollRef = useRef<number | null>(null);
  const runIdRef = useRef(0);

  function stopPoll() {
    if (pollRef.current !== null) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  useEffect(() => stopPoll, []);

  useEffect(() => {
    if (busyAction === "generate" && listing?.updated_at) {
      stopPoll();
      // eslint-disable-next-line react-hooks/set-state-in-effect -- beendet den Spinner genau einmal, wenn die neue Listing-Version ankommt
      setBusyAction(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listing?.updated_at]);

  function generate(preserveDescription = true) {
    setError(null);
    setBusyAction("generate");
    stopPoll();
    const runId = ++runIdRef.current;
    pollRef.current = window.setInterval(() => router.refresh(), 4000);
    void (async () => {
      try {
        const res = await fetch(`/api/projekte/${projectId}/listing`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ preserveDescription }),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as {
            error?: string;
          } | null;
          if (runId === runIdRef.current) {
            setError(data?.error ?? "Etwas ist schiefgelaufen.");
            stopPoll();
            setBusyAction(null);
          }
          return;
        }
        router.refresh();
      } catch {
        // Verbindung weg — Poll läuft weiter, der Server schreibt fertig.
      }
    })();
    // Notbremse: nach 90 s ohne Ergebnis nicht ewig „Wird erstellt…" zeigen.
    window.setTimeout(() => {
      if (runId === runIdRef.current && pollRef.current !== null) {
        stopPoll();
        setBusyAction(null);
        setError(
          "Das dauert ungewöhnlich lange. Lade die Seite neu — vielleicht ist das Listing schon da. Sonst versuch es noch einmal.",
        );
      }
    }, 90_000);
  }

  function save() {
    setError(null);
    setSaved(false);
    setBusyAction("save");
    startTransition(async () => {
      const parsedPrice = price.trim()
        ? Number(price.replace(",", "."))
        : null;
      const result = await updateListingAction(projectId, {
        title,
        subtitle,
        description,
        keywords: keywords.split("\n"),
        categories: categories.split("\n"),
        priceEur: parsedPrice,
      });
      if (result.ok) {
        setSaved(true);
        router.refresh();
      } else {
        setError(result.error ?? "Etwas ist schiefgelaufen.");
      }
      setBusyAction(null);
    });
  }

  function regenerate() {
    if (
      window.confirm(
        "Das ersetzt das aktuelle Listing durch einen neuen KI-Vorschlag — auch den Klappentext. Fortfahren?",
      )
    ) {
      generate(false);
    }
  }

  // „Vorhanden" heißt: der Titel ist da. Der Cover-Schritt legt die Zeile
  // nämlich schon mit NUR dem Klappentext an — die Seite zeigte dann ein
  // leeres Formular statt zu generieren (Benjamins Fund, 04.08.).
  const hasGenerated = Boolean(listing?.title?.trim());

  // Erster Besuch ohne generiertes Listing → von selbst loslegen. Niemand
  // will hier erst einen Knopf drücken; ein vorhandener Klappentext bleibt
  // dank preserveDescription erhalten.
  const autoStartedRef = useRef(false);
  useEffect(() => {
    if (autoStartedRef.current || hasGenerated) return;
    autoStartedRef.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- einmaliger Auto-Start nach dem Mount, per Ref gegen Wiederholung gesichert
    generate(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!hasGenerated) {
    return (
      <div className="mt-8 rounded-2xl border border-border bg-card p-6 sm:p-7">
        <p className="text-sm text-muted-foreground">
          Buchwerk erstellt aus deinem Buch Titel, Untertitel, Klappentext, 7
          Keywords, Kategorien und eine Preisempfehlung — kopierfertig für KDP.
          {listing?.description
            ? " Dein Klappentext aus dem Cover-Schritt bleibt dabei erhalten."
            : ""}
        </p>
        <div className="mt-4">
          <Button
            type="button"
            size="lg"
            disabled={busy}
            onClick={() => generate(true)}
          >
            {generating ? (
              <span className="inline-flex items-center gap-2">
                <Spinner className="size-4" />
                Wird erstellt… (~20 Sek.)
              </span>
            ) : (
              "KDP-Listing erstellen"
            )}
          </Button>
        </div>
        {error ? (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      <Field label="Titel" copyText={title}>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={busy}
          className="h-10"
        />
      </Field>

      <Field label="Untertitel" copyText={subtitle}>
        <Input
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          disabled={busy}
          className="h-10"
        />
      </Field>

      <Field label="Klappentext" copyText={description}>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={busy}
          rows={8}
          className={TEXTAREA_CLASS}
        />
      </Field>

      <Field label="7 Keywords (eine pro Zeile)" copyText={keywords}>
        <textarea
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          disabled={busy}
          rows={7}
          className={TEXTAREA_CLASS}
        />
      </Field>

      <Field label="Kategorien (eine pro Zeile)" copyText={categories}>
        <textarea
          value={categories}
          onChange={(e) => setCategories(e.target.value)}
          disabled={busy}
          rows={3}
          className={TEXTAREA_CLASS}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Vorgeschlagen aus dem Amazon-Kindle-Kategoriebaum. Amazon passt seine
          Kategorien gelegentlich an — taucht ein Pfad im KDP-Picker nicht exakt
          auf, wähle einfach eine vergleichbare Kategorie. Kleine Unterschiede
          haben kaum Einfluss auf dein Ranking.
        </p>
      </Field>

      <div className="space-y-1">
        <Label htmlFor="price">Preisempfehlung (EUR)</Label>
        <Input
          id="price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          disabled={busy}
          inputMode="decimal"
          className="h-10 max-w-32"
        />
        {listing?.price_note ? (
          <p className="text-sm text-muted-foreground">{listing.price_note}</p>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {saved ? (
        <p role="status" className="text-sm text-foreground">
          Gespeichert.
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
        <Button type="button" size="lg" disabled={busy} onClick={save}>
          {busyAction === "save" ? "Speichern…" : "Änderungen speichern"}
        </Button>
        {busyAction === "generate" ? (
          <span className="inline-flex items-center gap-2 text-sm font-medium text-clay-strong">
            <Spinner className="size-4" />
            Wird erstellt… (~20 Sek.)
          </span>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="lg"
            disabled={busy}
            onClick={regenerate}
          >
            Neu generieren
          </Button>
        )}
      </div>
    </div>
  );
}
