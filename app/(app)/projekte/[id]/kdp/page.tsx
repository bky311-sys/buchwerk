import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { KdpListing } from "@/components/buchwerk/kdp-listing";
import { Button } from "@/components/ui/button";
import { getWorkflowSteps } from "@/lib/books/workflow";
import { WorkflowStepper } from "@/components/buchwerk/workflow-stepper";
import { MarketCheckPanel } from "@/components/buchwerk/market-check-panel";
import {
  coerceMarketSnapshot,
  MARKET_STALE_MS,
} from "@/lib/books/market-check";

export const metadata: Metadata = {
  title: "KDP-Listing — Buchwerk",
};

// Listing generation runs inside a server action invoked from this route.
export const maxDuration = 60;

export default async function KdpPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("id, title, topic, published_at")
    .eq("id", id)
    .single();
  if (!project) notFound();

  const [{ data: listing }, workflowSteps] = await Promise.all([
    supabase
      .from("kdp_listings")
      .select(
        "title, subtitle, description, keywords, categories, price_eur, price_note, updated_at",
      )
      .eq("project_id", id)
      .maybeSingle(),
    getWorkflowSteps(supabase, id),
  ]);

  // Marktcheck-Daten (best-effort in eigener Abfrage — Regel 2026-07-15).
  const { data: marketRow } = await supabase
    .from("projects")
    .select("market_snapshot, market_status, market_updated_at")
    .eq("id", id)
    .maybeSingle();
  const marketSnapshot = coerceMarketSnapshot(marketRow?.market_snapshot ?? null);
  // eslint-disable-next-line react-hooks/purity
  const marketNow = Date.now();
  const marketAgeMs = marketRow?.market_updated_at
    ? marketNow - new Date(marketRow.market_updated_at).getTime()
    : Number.POSITIVE_INFINITY;
  const marketRunning =
    marketRow?.market_status === "läuft" && marketAgeMs < MARKET_STALE_MS;
  const marketFailed =
    marketRow?.market_status === "fehler" ||
    (marketRow?.market_status === "läuft" && !marketRunning);

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Link
        href={`/projekte/${id}`}
        className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
      >
        ← Zurück zum Projekt
      </Link>

      <h1 className="font-display mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
        KDP-Listing
      </h1>
      <p className="mt-3 text-base text-muted-foreground">
        {project.title ?? project.topic}
      </p>

      <div className="mt-5">
        <WorkflowStepper steps={workflowSteps} activeLabel="Listing" compact />
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Kopierfertige Texte für deinen KDP-Upload. Alles bearbeitbar, jedes Feld
        mit „Kopieren“.
      </p>

      {marketRow != null ? (
        <MarketCheckPanel
          projectId={id}
          snapshot={marketSnapshot}
          isRunning={marketRunning}
          hasFailed={marketFailed}
          hasListing={Boolean(listing?.title)}
          published={Boolean(project.published_at)}
        />
      ) : null}

      <KdpListing projectId={id} listing={listing ?? null} />

      {listing?.title ? (
        <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-border pt-6">
          <p className="text-sm font-medium text-success">✓ KDP-Listing steht.</p>
          <Button asChild size="lg">
            <Link href={`/projekte/${id}/veroeffentlichen`}>
              Weiter zum Veröffentlichen
            </Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
