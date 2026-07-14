"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateOutline } from "@/lib/books/outline-generate";
import { newProjectSchema } from "@/lib/books/schema";
import type { Database } from "@/types/supabase";

type ProjectInsert = Database["public"]["Tables"]["projects"]["Insert"];
type ChapterInsert = Database["public"]["Tables"]["chapters"]["Insert"];
type ListingInsert = Database["public"]["Tables"]["kdp_listings"]["Insert"];
type CoverInsert = Database["public"]["Tables"]["covers"]["Insert"];

export type ProjectFormState = { error: string | null };
export type ActionResult = { ok: boolean; error?: string };

// --- helpers ---------------------------------------------------------------

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

async function persistOrder(
  supabase: SupabaseClient,
  ids: string[],
): Promise<void> {
  for (let i = 0; i < ids.length; i++) {
    await supabase
      .from("chapters")
      .update({ position: i + 1 })
      .eq("id", ids[i]);
  }
}

async function orderedChapterIds(
  supabase: SupabaseClient,
  projectId: string,
): Promise<string[]> {
  const { data } = await supabase
    .from("chapters")
    .select("id")
    .eq("project_id", projectId)
    .order("position");
  return (data ?? []).map((row) => row.id);
}

// --- project + chapter creation (free: topic + outline) --------------------

export async function createProjectAction(
  _prev: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const parsed = newProjectSchema.safeParse({
    topic: formData.get("topic"),
    audience: formData.get("audience"),
  });
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Bitte prüfe deine Eingabe.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/anmelden");

  const topic = parsed.data.topic.trim();
  const audience = (parsed.data.audience ?? "").trim() || null;

  const { data: project, error: insertError } = await supabase
    .from("projects")
    .insert({ user_id: user.id, topic, audience, status: "gliederung" })
    .select("id")
    .single();
  if (insertError || !project) {
    return { error: "Das Projekt konnte nicht angelegt werden." };
  }

  try {
    const outline = await generateOutline(topic, audience);
    await supabase
      .from("projects")
      .update({ title: outline.titel, status: "schreiben" })
      .eq("id", project.id);
    await supabase.from("chapters").insert(
      outline.kapitel.map((kapitel, index) => ({
        project_id: project.id,
        position: index + 1,
        heading: kapitel.ueberschrift,
        summary: kapitel.zusammenfassung,
        status: "offen",
      })),
    );
  } catch {
    await supabase.from("projects").delete().eq("id", project.id);
    return {
      error:
        "Die Gliederung konnte nicht erstellt werden. Versuch es gleich noch einmal.",
    };
  }

  redirect(`/projekte/${project.id}`);
}

// Deletes a whole project (and, via ON DELETE CASCADE, its chapters, covers,
// listing and reviews). Allowed at any stage — also for unfinished books. RLS
// has a delete-own policy, so the caller's client enforces ownership.
export async function deleteProjectAction(
  projectId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Nicht angemeldet." };

  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId)
    .eq("user_id", user.id);
  if (error) return { ok: false, error: "Konnte das Projekt nicht löschen." };

  revalidatePath("/projekte");
  return { ok: true };
}

// Creates a new edition ("Neuauflage") of a published book. A published book is
// locked from editing; to change it, the author clones it into a fresh project
// that starts locked (must be freigeschaltet again) — so it counts as its own
// book in the monthly budget. Copies content (title, chapters, cover, listing,
// imprint) but resets all publish/shop state.
export async function createNewEditionAction(
  projectId: string,
): Promise<ActionResult & { newId?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Nicht angemeldet." };

  // Ownership check through the user's own (RLS-scoped) client.
  const { data: owned } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!owned) return { ok: false, error: "Projekt nicht gefunden." };

  const admin = createAdminClient();
  const { data: project } = await admin
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();
  if (!project) return { ok: false, error: "Projekt nicht gefunden." };

  // Strip identity + all publish/shop state; keep content columns via ...rest.
  const {
    id: _id,
    created_at: _createdAt,
    updated_at: _updatedAt,
    published_at: _publishedAt,
    shop_published: _shopPublished,
    shop_published_at: _shopPublishedAt,
    shop_slug: _shopSlug,
    amazon_url: _amazonUrl,
    boosted_until: _boostedUntil,
    title,
    status: _status,
    ...rest
  } = project as Record<string, unknown>;

  const baseTitle = typeof title === "string" ? title : "Neuauflage";
  const newTitle = /neuauflage/i.test(baseTitle)
    ? baseTitle
    : `${baseTitle} (Neuauflage)`;

  const projectInsert = {
    ...rest,
    user_id: user.id,
    title: newTitle,
    status: "schreiben",
    published_at: null,
    shop_published: false,
    shop_published_at: null,
    shop_slug: null,
    amazon_url: null,
    boosted_until: null,
  } as unknown as ProjectInsert;
  const { data: created, error: insertError } = await admin
    .from("projects")
    .insert(projectInsert)
    .select("id")
    .single();
  if (insertError || !created) {
    return { ok: false, error: "Die Neuauflage konnte nicht erstellt werden." };
  }
  const newId = created.id as string;

  // Clone chapters (content + structure) into the new project.
  const { data: chapters } = await admin
    .from("chapters")
    .select("*")
    .eq("project_id", projectId)
    .order("position");
  if (chapters && chapters.length > 0) {
    const rows = (chapters as Record<string, unknown>[]).map((ch) => {
      const {
        id: _chId,
        project_id: _chProject,
        created_at: _chCreated,
        updated_at: _chUpdated,
        ...chRest
      } = ch;
      return { ...chRest, project_id: newId };
    });
    await admin.from("chapters").insert(rows as unknown as ChapterInsert[]);
  }

  // Clone the KDP listing (subtitle/description) if present.
  const { data: listing } = await admin
    .from("kdp_listings")
    .select("*")
    .eq("project_id", projectId)
    .maybeSingle();
  if (listing) {
    const {
      project_id: _lProject,
      created_at: _lCreated,
      updated_at: _lUpdated,
      ...lRest
    } = listing as Record<string, unknown>;
    await admin
      .from("kdp_listings")
      .insert({ ...lRest, project_id: newId } as unknown as ListingInsert);
  }

  // Clone the selected cover so the edition starts from the same artwork.
  const { data: cover } = await admin
    .from("covers")
    .select("*")
    .eq("project_id", projectId)
    .eq("is_selected", true)
    .maybeSingle();
  if (cover) {
    const {
      id: _cId,
      project_id: _cProject,
      created_at: _cCreated,
      ...cRest
    } = cover as Record<string, unknown>;
    await admin
      .from("covers")
      .insert({
        ...cRest,
        project_id: newId,
        is_selected: true,
      } as unknown as CoverInsert);
  }

  revalidatePath("/projekte");
  return { ok: true, newId };
}

// Chapter generation lives in lib/books/generate.ts and is driven through the
// /api/chapters/[id]/generate route so the UI can fire it and poll for the
// result instead of blocking on one long request.

// --- outline editing (free) ------------------------------------------------

export async function updateProjectTitleAction(
  projectId: string,
  title: string,
): Promise<ActionResult> {
  const trimmed = title.trim();
  if (!trimmed) return { ok: false, error: "Der Titel darf nicht leer sein." };
  if (trimmed.length > 300) return { ok: false, error: "Der Titel ist zu lang." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({ title: trimmed })
    .eq("id", projectId);
  if (error) return { ok: false, error: "Konnte nicht gespeichert werden." };

  revalidatePath(`/projekte/${projectId}`);
  return { ok: true };
}

export async function updateChapterAction(
  chapterId: string,
  heading: string,
  summary: string,
): Promise<ActionResult> {
  const trimmedHeading = heading.trim();
  if (!trimmedHeading) {
    return { ok: false, error: "Die Überschrift darf nicht leer sein." };
  }
  if (trimmedHeading.length > 300) {
    return { ok: false, error: "Die Überschrift ist zu lang." };
  }

  const supabase = await createClient();
  const { data: chapter } = await supabase
    .from("chapters")
    .select("project_id")
    .eq("id", chapterId)
    .single();
  if (!chapter) return { ok: false, error: "Kapitel nicht gefunden." };

  const { error } = await supabase
    .from("chapters")
    .update({ heading: trimmedHeading, summary: summary.trim() || null })
    .eq("id", chapterId);
  if (error) return { ok: false, error: "Konnte nicht gespeichert werden." };

  revalidatePath(`/projekte/${chapter.project_id}`);
  return { ok: true };
}

export async function addChapterAction(
  projectId: string,
  heading: string,
  summary: string,
): Promise<ActionResult> {
  const trimmedHeading = heading.trim();
  if (!trimmedHeading) {
    return { ok: false, error: "Bitte gib eine Überschrift ein." };
  }
  if (trimmedHeading.length > 300) {
    return { ok: false, error: "Die Überschrift ist zu lang." };
  }

  const supabase = await createClient();
  const { data: last } = await supabase
    .from("chapters")
    .select("position")
    .eq("project_id", projectId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextPosition = (last?.position ?? 0) + 1;
  const { error } = await supabase.from("chapters").insert({
    project_id: projectId,
    position: nextPosition,
    heading: trimmedHeading,
    // The topic guides what the AI writes for this chapter, so we ask for it.
    summary: summary.trim() || null,
    status: "offen",
  });
  if (error) return { ok: false, error: "Kapitel konnte nicht angelegt werden." };

  revalidatePath(`/projekte/${projectId}`);
  return { ok: true };
}

export async function deleteChapterAction(
  chapterId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: chapter } = await supabase
    .from("chapters")
    .select("project_id")
    .eq("id", chapterId)
    .single();
  if (!chapter) return { ok: false, error: "Kapitel nicht gefunden." };

  const { error } = await supabase.from("chapters").delete().eq("id", chapterId);
  if (error) return { ok: false, error: "Kapitel konnte nicht gelöscht werden." };

  await persistOrder(supabase, await orderedChapterIds(supabase, chapter.project_id));
  revalidatePath(`/projekte/${chapter.project_id}`);
  return { ok: true };
}

export async function moveChapterAction(
  chapterId: string,
  direction: "up" | "down",
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: chapter } = await supabase
    .from("chapters")
    .select("project_id")
    .eq("id", chapterId)
    .single();
  if (!chapter) return { ok: false, error: "Kapitel nicht gefunden." };

  const ids = await orderedChapterIds(supabase, chapter.project_id);
  const index = ids.indexOf(chapterId);
  const target = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || target < 0 || target >= ids.length) {
    return { ok: true };
  }

  [ids[index], ids[target]] = [ids[target], ids[index]];
  await persistOrder(supabase, ids);
  revalidatePath(`/projekte/${chapter.project_id}`);
  return { ok: true };
}

// Outline regeneration lives in lib/books/outline-generate.ts and is driven
// through the /api/projekte/[id]/outline route so the UI can fire it and poll
// the project status for the result instead of blocking on one long request.
