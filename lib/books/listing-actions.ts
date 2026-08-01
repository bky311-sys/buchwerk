"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Die Generierung selbst lebt in lib/books/listing-generate.ts und läuft über
// die API-Route /api/projekte/[id]/listing (Trigger+Poll statt blockierender
// Action — siehe Kommentar dort). Hier bleibt nur das Speichern von Edits.

export type ListingResult = { ok: boolean; error?: string };

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
