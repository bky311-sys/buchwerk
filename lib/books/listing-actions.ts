"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { claudeJson } from "@/lib/ai/anthropic";
import { loadPrompt } from "@/lib/ai/prompts";
import { gateProduction } from "@/lib/billing/access";
import { LISTING_JSON_SCHEMA, listingSchema } from "@/lib/books/listing-schema";

const DEFAULT_AUDIENCE = "allgemein interessierte Erwachsene";

export type ListingResult = { ok: boolean; error?: string };

export async function generateListingAction(
  projectId: string,
): Promise<ListingResult> {
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("id, title, topic, audience")
    .eq("id", projectId)
    .single();
  if (!project) return { ok: false, error: "Projekt nicht gefunden." };

  const gate = await gateProduction(supabase, projectId);
  if (!gate.ok) return { ok: false, error: gate.error };

  const { data: chapters } = await supabase
    .from("chapters")
    .select("position, heading, summary")
    .eq("project_id", projectId)
    .order("position");

  const gliederung = (chapters ?? [])
    .map((c) => `${c.position}. ${c.heading} — ${c.summary ?? ""}`)
    .join("\n");

  try {
    const prompt = await loadPrompt("kdp-listing", {
      titel: project.title ?? project.topic,
      thema: project.topic,
      zielgruppe: project.audience ?? DEFAULT_AUDIENCE,
      gliederung,
    });
    const raw = await claudeJson({
      messages: [{ role: "user", content: prompt }],
      maxTokens: 2000,
      jsonSchema: LISTING_JSON_SCHEMA,
    });
    const listing = listingSchema.parse(raw);

    await supabase.from("kdp_listings").upsert(
      {
        project_id: projectId,
        title: listing.titel,
        subtitle: listing.untertitel,
        description: listing.beschreibung,
        keywords: listing.keywords.slice(0, 7),
        categories: listing.kategorien.slice(0, 3),
        price_eur: listing.preis_empfehlung,
        price_note: listing.preis_begruendung,
      },
      { onConflict: "project_id" },
    );

    revalidatePath(`/projekte/${projectId}/kdp`);
    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "Das Listing konnte nicht erstellt werden. Versuch es noch einmal.",
    };
  }
}

export type ListingFields = {
  title: string;
  subtitle: string;
  description: string;
  keywords: string[];
  categories: string[];
  priceEur: number | null;
};

export async function updateListingAction(
  projectId: string,
  fields: ListingFields,
): Promise<ListingResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("kdp_listings")
    .update({
      title: fields.title.trim(),
      subtitle: fields.subtitle.trim(),
      description: fields.description.trim(),
      keywords: fields.keywords.map((k) => k.trim()).filter(Boolean).slice(0, 7),
      categories: fields.categories
        .map((c) => c.trim())
        .filter(Boolean)
        .slice(0, 3),
      price_eur:
        fields.priceEur != null && Number.isFinite(fields.priceEur)
          ? fields.priceEur
          : null,
    })
    .eq("project_id", projectId);

  if (error) return { ok: false, error: "Konnte nicht gespeichert werden." };

  revalidatePath(`/projekte/${projectId}/kdp`);
  return { ok: true };
}
