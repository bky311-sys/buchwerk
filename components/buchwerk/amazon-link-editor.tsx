"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateAmazonUrlAction } from "@/lib/books/publish-actions";

// Nachträglich den Amazon-Link eintragen — für veröffentlichte Bücher jederzeit
// möglich. Eigene Komponente, weil sie an zwei Stellen gebraucht wird: auf der
// Veröffentlichen-Seite und im Hub (dort fehlte sie zuerst — Benjamins Fund
// 05.08., das Buch war schon veröffentlicht, aber der Link nirgends im Hub
// eintragbar, nur auf der separaten Unterseite).
export function AmazonLinkEditor({
  projectId,
  amazonUrl,
}: {
  projectId: string;
  amazonUrl: string | null;
}) {
  const router = useRouter();
  const [amazon, setAmazon] = useState(amazonUrl ?? "");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await updateAmazonUrlAction(projectId, amazon);
      if (result.ok) router.refresh();
      else setError(result.error ?? "Etwas ist schiefgelaufen.");
    });
  }

  return (
    <div className="max-w-md space-y-1.5">
      <Label htmlFor={`amazon-url-${projectId}`}>Amazon-Link (optional)</Label>
      <div className="flex flex-wrap gap-2">
        <Input
          id={`amazon-url-${projectId}`}
          type="url"
          inputMode="url"
          value={amazon}
          onChange={(e) => setAmazon(e.target.value)}
          disabled={isPending}
          placeholder="https://www.amazon.de/dp/…"
          className="min-w-0 flex-1"
        />
        <Button
          type="button"
          variant="secondary"
          disabled={isPending || amazon.trim() === (amazonUrl ?? "").trim()}
          onClick={save}
        >
          {isPending ? "…" : "Speichern"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Kannst du jederzeit nachtragen — der Link erscheint dann auch als „Bei
        Amazon kaufen“ im Buchwerk-Shop.
      </p>
      {amazon.trim() ? (
        <a
          href={amazon.trim()}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block pt-1 text-sm font-semibold text-primary underline underline-offset-4"
        >
          Zum Buch bei Amazon →
        </a>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
