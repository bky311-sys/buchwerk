"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { generateOutline } from "@/lib/books/outline-generate";
import { newProjectSchema } from "@/lib/books/schema";

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
