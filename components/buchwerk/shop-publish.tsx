"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/buchwerk/status-badge";
import {
  publishToShopAction,
  unpublishFromShopAction,
} from "@/lib/shop/actions";
import { boostBookAction } from "@/lib/shop/boost";
import { BOOST_COST, BOOST_DAYS } from "@/lib/shop/boost-config";

type BlockReason = "not_finished" | "not_subscriber" | null;

type Props = {
  projectId: string;
  isPublished: boolean;
  shopSlug: string | null;
  amazonUrl: string | null;
  canPublish: boolean;
  blockReason: BlockReason;
  pointsBalance: number;
  boostedUntil: string | null;
};

export function ShopPublish({
  projectId,
  isPublished,
  shopSlug,
  amazonUrl,
  canPublish,
  blockReason,
  pointsBalance,
  boostedUntil,
}: Props) {
  const router = useRouter();
  const [amazon, setAmazon] = useState(amazonUrl ?? "");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.ok) router.refresh();
      else setError(result.error ?? "Etwas ist schiefgelaufen.");
    });
  }

  function publish() {
    run(() => publishToShopAction(projectId, amazon));
  }

  function unpublish() {
    run(() => unpublishFromShopAction(projectId));
  }

  const boostActive =
    boostedUntil !== null &&
    // eslint-disable-next-line react-hooks/purity -- current time is exactly what we want
    new Date(boostedUntil).getTime() > Date.now();

  return (
    <section className="rounded-2xl border border-border bg-card p-6 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold">Buchshop</h2>
        {isPublished ? (
          <StatusBadge intent="done">✓ Veröffentlicht</StatusBadge>
        ) : (
          <StatusBadge intent="neutral">Nicht veröffentlicht</StatusBadge>
        )}
      </div>

      {isPublished ? (
        <div className="mt-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            Dein Buch ist im Buchshop sichtbar. Titel, Cover und Klappentext
            werden automatisch aus deinem Projekt übernommen.
          </p>
          {shopSlug ? (
            <Link
              href={`/buchshop/${shopSlug}`}
              className="inline-block text-sm font-semibold text-primary underline underline-offset-4"
            >
              Zur Shop-Seite ansehen →
            </Link>
          ) : null}

          <div className="rounded-xl border border-border bg-muted p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold">Buch boosten</span>
              {boostActive ? (
                <StatusBadge intent="done">Aktiv im Shop</StatusBadge>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {boostActive
                ? "Dein Buch wird gerade im Shop hervorgehoben und sucht Bewertungen."
                : `Setze ${BOOST_COST} Punkte ein, um dein Buch ${BOOST_DAYS} Tage im Shop hervorzuheben.`}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="secondary"
                disabled={isPending || pointsBalance < BOOST_COST}
                onClick={() => run(() => boostBookAction(projectId))}
              >
                {isPending
                  ? "…"
                  : boostActive
                    ? `Verlängern (${BOOST_COST} Punkte)`
                    : `Boosten (${BOOST_COST} Punkte)`}
              </Button>
              <span className="text-sm text-muted-foreground">
                Du hast{" "}
                <span className="font-semibold text-foreground">
                  {pointsBalance}
                </span>{" "}
                Punkte
              </span>
            </div>
          </div>

          <div>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={unpublish}
            >
              {isPending ? "…" : "Aus dem Shop zurückziehen"}
            </Button>
          </div>
        </div>
      ) : canPublish ? (
        <div className="mt-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            Zeig dein fertiges Buch im Buchshop. Wenn du einen Amazon-Link
            angibst, führt der „Bei Amazon kaufen“-Button Leser direkt zu deinem
            KDP-Buch — der Link ist aber optional.
          </p>
          <div className="max-w-md space-y-1.5">
            <Label htmlFor="amazon-url">Amazon-Link (optional)</Label>
            <Input
              id="amazon-url"
              type="url"
              inputMode="url"
              value={amazon}
              onChange={(e) => setAmazon(e.target.value)}
              disabled={isPending}
              placeholder="https://www.amazon.de/dp/…"
            />
          </div>
          <Button type="button" disabled={isPending} onClick={publish}>
            {isPending ? "Wird veröffentlicht…" : "Im Buchshop veröffentlichen"}
          </Button>
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          {blockReason === "not_subscriber"
            ? "Das Veröffentlichen im Buchshop ist Abonnenten vorbehalten. Mit einem Abo kannst du deine fertigen Bücher im Shop zeigen."
            : "Sobald alle Kapitel geschrieben sind, kannst du dieses Buch (als Abonnent) im Buchshop veröffentlichen."}
        </p>
      )}

      {error ? (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </section>
  );
}
