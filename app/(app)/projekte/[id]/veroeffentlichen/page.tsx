import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isProjectUnlocked, isSubscriber } from "@/lib/billing/access";
import { Button } from "@/components/ui/button";
import { ImprintForm } from "@/components/buchwerk/imprint-form";
import { PublishGuide } from "@/components/buchwerk/publish-guide";
import { PublishStatus } from "@/components/buchwerk/publish-status";
import { ShopPublish } from "@/components/buchwerk/shop-publish";
import { ReviewModeration } from "@/components/buchwerk/review-moderation";
import { getPendingReviewsForAuthor } from "@/lib/shop/reviews";
import { getPointsBalance } from "@/lib/shop/points";

export const metadata: Metadata = {
  title: "Veröffentlichen — Buchwerk",
};

export const maxDuration = 60;

export default async function VeroeffentlichenPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("id, title, topic")
    .eq("id", id)
    .single();
  if (!project) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [unlocked, { data: chapters }, subscriber] = await Promise.all([
    isProjectUnlocked(supabase, id),
    supabase.from("chapters").select("content").eq("project_id", id),
    user ? isSubscriber(supabase, user.id) : Promise.resolve(false),
  ]);

  const list = chapters ?? [];
  const hasWrittenChapters = list.some((c) => Boolean(c.content));
  const finished = list.length > 0 && list.every((c) => Boolean(c.content));

  const title = project.title ?? project.topic;

  const backLink = (
    <Link
      href={`/projekte/${project.id}`}
      className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
    >
      ← Zum Projekt
    </Link>
  );

  // Not unlocked → nothing to publish yet; send to the paywall.
  if (!unlocked) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        {backLink}
        <h1 className="mt-6 font-display text-2xl font-bold tracking-tight sm:text-3xl">
          Veröffentlichen
        </h1>
        <p className="mt-2 text-base text-muted-foreground">{title}</p>
        <div className="mt-8 rounded-2xl border border-border bg-card p-6">
          <p className="text-sm font-semibold">
            Dieses Buch ist noch nicht freigeschaltet.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Schalte das Buch frei, schreibe die Kapitel, erstelle Cover und
            KDP-Listing — danach geht es hier ans Veröffentlichen.
          </p>
          <div className="mt-4">
            <Button asChild size="lg">
              <Link href={`/projekte/${project.id}/freischalten`}>
                Buch freischalten
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Imprint (Impressum) — mandatory in the manuscript before export (best-effort
  // query so a lagging migration doesn't break the page).
  const { data: imprintRow } = await supabase
    .from("projects")
    .select("imprint_name, imprint_street, imprint_zip, imprint_city, author")
    .eq("id", id)
    .maybeSingle();
  const imprint = {
    name: imprintRow?.imprint_name ?? imprintRow?.author ?? "",
    street: imprintRow?.imprint_street ?? "",
    zip: imprintRow?.imprint_zip ?? "",
    city: imprintRow?.imprint_city ?? "",
  };
  const imprintComplete = Boolean(
    (imprintRow?.imprint_name ?? "").trim() &&
      imprint.street.trim() &&
      imprint.zip.trim() &&
      imprint.city.trim(),
  );

  // Buchshop + published milestone (best-effort: sections stay hidden if a
  // migration lags).
  const { data: shopRow } = await supabase
    .from("projects")
    .select("shop_published, shop_slug, amazon_url, published_at")
    .eq("id", id)
    .maybeSingle();

  const pendingReviews = shopRow?.shop_published
    ? await getPendingReviewsForAuthor(id)
    : [];
  const pointsBalance =
    shopRow?.shop_published && user
      ? await getPointsBalance(supabase, user.id)
      : 0;
  const { data: boostRow } = shopRow?.shop_published
    ? await supabase
        .from("projects")
        .select("boosted_until")
        .eq("id", id)
        .maybeSingle()
    : { data: null };
  const boostedUntil = boostRow?.boosted_until ?? null;

  const canPublish = finished && subscriber;
  const blockReason = !finished
    ? ("not_finished" as const)
    : !subscriber
      ? ("not_subscriber" as const)
      : null;

  // Whether cover and KDP listing already exist — drives the done-state in the
  // publish checklist (best-effort so a lagging migration can't break the page).
  const { data: selectedCover } = await supabase
    .from("covers")
    .select("id")
    .eq("project_id", id)
    .eq("is_selected", true)
    .maybeSingle();
  const { data: listingRow } = await supabase
    .from("kdp_listings")
    .select("project_id")
    .eq("project_id", id)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      {backLink}
      <h1 className="mt-6 font-display text-2xl font-bold tracking-tight sm:text-3xl">
        Veröffentlichen
      </h1>
      <p className="mt-2 text-base text-muted-foreground">{title}</p>

      {!finished ? (
        <div className="mt-8 rounded-2xl border border-border bg-card p-6">
          <p className="text-sm font-semibold">
            Zuerst alle Kapitel fertig schreiben.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Zum Veröffentlichen muss das Manuskript vollständig sein.
          </p>
          <div className="mt-4">
            <Button asChild>
              <Link href={`/projekte/${project.id}/schreiben`}>
                Weiter schreiben
              </Link>
            </Button>
          </div>
        </div>
      ) : null}

      {/* Manuskript-Download — erst wenn fertig und Impressum vollständig. */}
      {finished ? (
        <div className="mt-8">
          <h2 className="font-display text-lg font-semibold tracking-tight">
            Manuskript herunterladen
          </h2>
          {imprintComplete ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button asChild variant="ink" size="lg">
                <a href={`/projekte/${project.id}/manuskript/epub`} download>
                  Manuskript-EPUB (eBook)
                </a>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href={`/projekte/${project.id}/manuskript/pdf`} download>
                  Manuskript-PDF (Print)
                </a>
              </Button>
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              Fülle zuerst das Impressum aus — es ist Pflichtangabe im Buch.
            </p>
          )}
        </div>
      ) : null}

      {hasWrittenChapters ? (
        <div className="mt-6">
          <ImprintForm
            projectId={project.id}
            name={imprint.name}
            street={imprint.street}
            zip={imprint.zip}
            city={imprint.city}
          />
        </div>
      ) : null}

      <div className="mt-6">
        <PublishGuide
          projectId={project.id}
          finished={finished}
          imprintComplete={imprintComplete}
          hasListing={Boolean(listingRow)}
          hasCover={Boolean(selectedCover)}
        />
      </div>

      <div className="mt-4">
        <PublishStatus
          projectId={project.id}
          publishedAt={shopRow?.published_at ?? null}
          amazonUrl={shopRow?.amazon_url ?? null}
        />
      </div>

      {shopRow ? (
        <div className="mt-4">
          <ShopPublish
            projectId={project.id}
            isPublished={shopRow.shop_published}
            shopSlug={shopRow.shop_slug}
            amazonUrl={shopRow.amazon_url}
            canPublish={canPublish}
            blockReason={blockReason}
            pointsBalance={pointsBalance}
            boostedUntil={boostedUntil}
          />
        </div>
      ) : null}

      {pendingReviews.length > 0 ? (
        <div className="mt-4">
          <ReviewModeration reviews={pendingReviews} />
        </div>
      ) : null}
    </div>
  );
}
