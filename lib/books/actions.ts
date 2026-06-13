"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { claudeJson, claudeText } from "@/lib/ai/anthropic";
import { loadPrompt } from "@/lib/ai/prompts";
import {
  newProjectSchema,
  outlineSchema,
  OUTLINE_JSON_SCHEMA,
  type Outline,
} from "@/lib/books/schema";

const DEFAULT_AUDIENCE = "allgemein interessierte Erwachsene";

export type ProjectFormState = { error: string | null };
export type ActionResult = { ok: boolean; error?: string };

// --- helpers ---------------------------------------------------------------

async function generateOutline(
  topic: string,
  audience: string | null,
): Promise<Outline> {
  const prompt = await loadPrompt("gliederung", {
    thema: topic,
    zielgruppe: audience ?? DEFAULT_AUDIENCE,
  });
  const raw = await claudeJson({
    messages: [{ role: "user", content: prompt }],
    maxTokens: 2000,
    jsonSchema: OUTLINE_JSON_SCHEMA,
  });
  return outlineSchema.parse(raw);
}

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

// Renumber a project's chapters to 1..N in the given id order.
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

// --- project + chapter creation -------------------------------------------

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

export type ChapterResult = { ok: boolean; error?: string };

export async function generateChapterAction(
  chapterId: string,
): Promise<ChapterResult> {
  const supabase = await createClient();

  const { data: chapter, error: chapterError } = await supabase
    .from("chapters")
    .select("id, project_id, position, heading, summary")
    .eq("id", chapterId)
    .single();
  if (chapterError || !chapter) {
    return { ok: false, error: "Kapitel nicht gefunden." };
  }

  const { data: project } = await supabase
    .from("projects")
    .select("title, topic, audience")
    .eq("id", chapter.project_id)
    .single();
  if (!project) {
    return { ok: false, error: "Projekt nicht gefunden." };
  }

  const { data: allChapters } = await supabase
    .from("chapters")
    .select("position, heading, summary")
    .eq("project_id", chapter.project_id)
    .order("position");

  const gliederung = (allChapters ?? [])
    .map((c) => `${c.position}. ${c.heading} — ${c.summary ?? ""}`)
    .join("\n");

  try {
    const prompt = await loadPrompt("kapitel", {
      titel: project.title ?? project.topic,
      thema: project.topic,
      zielgruppe: project.audience ?? DEFAULT_AUDIENCE,
      gliederung,
      nummer: String(chapter.position),
      ueberschrift: chapter.heading,
      zusammenfassung: chapter.summary ?? "",
    });
    const content = await claudeText({
      messages: [{ role: "user", content: prompt }],
      maxTokens: 6000,
    });

    await supabase
      .from("chapters")
      .update({ content, status: "fertig" })
      .eq("id", chapter.id);

    revalidatePath(`/projekte/${chapter.project_id}`);
    return { ok: true };
  } catch {
    return {
      ok: false,
      error:
        "Das Kapitel konnte nicht generiert werden. Versuch es noch einmal.",
    };
  }
}

// --- outline editing -------------------------------------------------------

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
): Promise<ActionResult> {
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
    heading: "Neues Kapitel",
    summary: "",
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
    return { ok: true }; // already at the edge — no-op
  }

  [ids[index], ids[target]] = [ids[target], ids[index]];
  await persistOrder(supabase, ids);
  revalidatePath(`/projekte/${chapter.project_id}`);
  return { ok: true };
}

export async function regenerateOutlineAction(
  projectId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("id, topic, audience")
    .eq("id", projectId)
    .single();
  if (!project) return { ok: false, error: "Projekt nicht gefunden." };

  try {
    const outline = await generateOutline(project.topic, project.audience);
    await supabase.from("chapters").delete().eq("project_id", projectId);
    await supabase
      .from("projects")
      .update({ title: outline.titel, status: "schreiben" })
      .eq("id", projectId);
    await supabase.from("chapters").insert(
      outline.kapitel.map((kapitel, index) => ({
        project_id: projectId,
        position: index + 1,
        heading: kapitel.ueberschrift,
        summary: kapitel.zusammenfassung,
        status: "offen",
      })),
    );
    revalidatePath(`/projekte/${projectId}`);
    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "Die Gliederung konnte nicht neu erstellt werden.",
    };
  }
}
