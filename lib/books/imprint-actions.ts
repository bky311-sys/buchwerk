"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ImprintFields = {
  name: string;
  street: string;
  zip: string;
  city: string;
};

export type ImprintResult = { ok: boolean; error?: string };

// Saves the imprint (Impressum) data that gets rendered into the manuscript PDF.
// Owner-scoped via RLS; the columns are in the authenticated UPDATE grant.
export async function updateImprintAction(
  projectId: string,
  fields: ImprintFields,
): Promise<ImprintResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({
      imprint_name: fields.name.trim() || null,
      imprint_street: fields.street.trim() || null,
      imprint_zip: fields.zip.trim() || null,
      imprint_city: fields.city.trim() || null,
    })
    .eq("id", projectId);
  if (error) return { ok: false, error: "Konnte nicht gespeichert werden." };

  revalidatePath(`/projekte/${projectId}`);
  return { ok: true };
}
