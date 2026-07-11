"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  generateListingAction,
  updateListingAction,
} from "@/lib/books/listing-actions";

type Listing = {
  title: string | null;
  subtitle: string | null;
  description: string | null;
  keywords: string[] | null;
  categories: string[] | null;
  price_eur: number | null;
  price_note: string | null;
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

  function generate() {
    setError(null);
    startTransition(async () => {
      const result = await generateListingAction(projectId);
      if (result.ok) router.refresh();
      else setError(result.error ?? "Etwas ist schiefgelaufen.");
    });
  }

  function save() {
    setError(null);
    setSaved(false);
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
    });
  }

  function regenerate() {
    if (
      window.confirm(
        "Das ersetzt das aktuelle Listing durch einen neuen KI-Vorschlag. Fortfahren?",
      )
    ) {
      generate();
    }
  }

  if (!listing) {
    return (
      <div className="mt-8 rounded-2xl border border-border bg-card p-6 sm:p-7">
        <p className="text-sm text-muted-foreground">
          Noch kein Listing. Buchwerk erstellt aus deinem Buch Titel, Untertitel,
          Klappentext, 7 Keywords, Kategorien und eine Preisempfehlung —
          kopierfertig für KDP.
        </p>
        <div className="mt-4">
          <Button type="button" size="lg" disabled={isPending} onClick={generate}>
            {isPending ? "Wird erstellt… (~20 Sek.)" : "KDP-Listing erstellen"}
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
          disabled={isPending}
          className="h-10"
        />
      </Field>

      <Field label="Untertitel" copyText={subtitle}>
        <Input
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          disabled={isPending}
          className="h-10"
        />
      </Field>

      <Field label="Klappentext" copyText={description}>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isPending}
          rows={8}
          className={TEXTAREA_CLASS}
        />
      </Field>

      <Field label="7 Keywords (eine pro Zeile)" copyText={keywords}>
        <textarea
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          disabled={isPending}
          rows={7}
          className={TEXTAREA_CLASS}
        />
      </Field>

      <Field label="Kategorien (eine pro Zeile)" copyText={categories}>
        <textarea
          value={categories}
          onChange={(e) => setCategories(e.target.value)}
          disabled={isPending}
          rows={3}
          className={TEXTAREA_CLASS}
        />
      </Field>

      <div className="space-y-1">
        <Label htmlFor="price">Preisempfehlung (EUR)</Label>
        <Input
          id="price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          disabled={isPending}
          inputMode="decimal"
          className="h-10 max-w-32"
        />
        {listing.price_note ? (
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

      <div className="flex flex-wrap gap-2 border-t border-border pt-4">
        <Button type="button" size="lg" disabled={isPending} onClick={save}>
          {isPending ? "Speichern…" : "Änderungen speichern"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="lg"
          disabled={isPending}
          onClick={regenerate}
        >
          Neu generieren
        </Button>
      </div>
    </div>
  );
}
