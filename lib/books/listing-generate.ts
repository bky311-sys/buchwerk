import "server-only";

import { createClient } from "@/lib/supabase/server";
import { claudeJson } from "@/lib/ai/anthropic";
import { loadPrompt } from "@/lib/ai/prompts";
import { gateProduction } from "@/lib/billing/access";
import { LISTING_JSON_SCHEMA, listingSchema } from "@/lib/books/listing-schema";
import { KDP_CATEGORIES } from "@/lib/books/kdp-categories";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

const DEFAULT_AUDIENCE = "allgemein interessierte Erwachsene";

export type ListingGenerateResult = { ok: boolean; error?: string };

// Kern der Listing-Generierung, aufrufbar aus der API-Route. Früher lebte das
// in einer blockierenden Server Action — als letzter langer Flow ohne
// Trigger+Poll (UX-Review #3): bei Verbindungsabbruch wirkte die Seite hängend.
// Jetzt feuert der Client die Route per fetch und pollt die Seite; stirbt die
// Verbindung, schreibt der Server trotzdem fertig und der Poll zeigt das
// Ergebnis.
export async function generateListing(
  supabase: SupabaseClient,
  projectId: string,
  // Erst-Generierung bewahrt einen schon vorhandenen Klappentext: der stammt
  // aus dem Cover-Schritt und steht ggf. bereits auf der gedruckten Rückseite —
  // stillschweigend ersetzen würde Buchrücken und Listing auseinanderziehen.
  // Explizites „Neu generieren" (preserveDescription=false) überschreibt alles.
  preserveDescription = true,
): Promise<ListingGenerateResult> {
  const { data: project } = await supabase
    .from("projects")
    .select("id, title, topic, audience")
    .eq("id", projectId)
    .single();
  if (!project) return { ok: false, error: "Projekt nicht gefunden." };

  const { data: existing } = await supabase
    .from("kdp_listings")
    .select("description")
    .eq("project_id", projectId)
    .maybeSingle();
  const keptDescription =
    preserveDescription && existing?.description?.trim()
      ? existing.description
      : null;

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
      kategorien_liste: KDP_CATEGORIES.map((c) => `- ${c}`).join("\n"),
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
        description: keptDescription ?? listing.beschreibung,
        keywords: listing.keywords.slice(0, 7),
        categories: listing.kategorien.slice(0, 3),
        price_eur: listing.preis_empfehlung,
        price_note: listing.preis_begruendung,
      },
      { onConflict: "project_id" },
    );

    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "Das Listing konnte nicht erstellt werden. Versuch es noch einmal.",
    };
  }
}
