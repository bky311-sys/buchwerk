import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSubscriber } from "@/lib/billing/access";
import { chapterEligible } from "@/lib/shop/reading";

// Der Leser bestätigt aktiv, dass er ein Kapitel gelesen hat — das ist die
// eigentliche Freigabe für die Bewertung, nicht die Heartbeat-Messung selbst
// (siehe Entscheidungslog CLAUDE.md 05.08.: "Nutzer bestätigt = Freigabe").
//
// Der Server nimmt den Klick trotzdem nicht blind entgegen: er prüft
// unabhängig, ob die (niedrige) technische Schwelle erreicht ist — sonst wäre
// dieser Endpunkt eine reine, direkt POST-bare Selbstauskunft ohne jede
// Prüfung, und genau das soll Anhang Nr. 23b UWG vermeiden helfen.
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  let body: { chapterId?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }
  const chapterId = typeof body.chapterId === "string" ? body.chapterId : null;
  if (!chapterId) {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const admin = createAdminClient();

  // Dieselben Zugriffs-Checks wie beim Heartbeat — ein API-Endpunkt ist auch
  // ohne die Reader-Seite erreichbar.
  const { data: chapter } = await admin
    .from("chapters")
    .select("id, project_id, content")
    .eq("id", chapterId)
    .maybeSingle();
  if (!chapter) {
    return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });
  }

  const { data: book } = await admin
    .from("projects")
    .select("id, user_id, shop_published, shop_readable")
    .eq("id", chapter.project_id)
    .maybeSingle();
  if (!book || !book.shop_published || !book.shop_readable) {
    return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });
  }
  if (book.user_id === user.id) {
    return NextResponse.json(
      { error: "Du kannst dein eigenes Buch nicht bestätigen." },
      { status: 403 },
    );
  }
  if (!(await isSubscriber(supabase, user.id))) {
    return NextResponse.json({ error: "Kein Zugriff." }, { status: 402 });
  }

  const { data: existing } = await admin
    .from("reading_progress")
    .select("id, max_scroll, seconds_active, confirmed_at")
    .eq("chapter_id", chapterId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json(
      { error: "Noch nichts zu bestätigen — lies erst ein Stück." },
      { status: 400 },
    );
  }

  // Idempotent: ein zweiter Klick (Doppel-Request, Reload) ist kein Fehler.
  if (existing.confirmed_at) {
    return NextResponse.json({ ok: true, confirmedAt: existing.confirmed_at });
  }

  if (!chapterEligible(chapter.content, existing.max_scroll, existing.seconds_active)) {
    return NextResponse.json(
      { error: "Noch nicht bereit — bis zum Ende scrollen und kurz aktiv bleiben." },
      { status: 400 },
    );
  }

  const confirmedAt = new Date().toISOString();
  const { error } = await admin
    .from("reading_progress")
    .update({ confirmed_at: confirmedAt })
    .eq("id", existing.id);
  if (error) {
    return NextResponse.json(
      { error: "Konnte nicht gespeichert werden." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, confirmedAt });
}
