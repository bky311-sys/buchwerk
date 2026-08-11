import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { PlanToggle } from "@/components/buchwerk/plan-toggle";
import { WaitlistGrant } from "@/components/buchwerk/waitlist-grant";

export const metadata: Metadata = {
  title: "Admin — Buchwerk",
};

export const dynamic = "force-dynamic";

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border p-5">
      <p className="text-3xl font-medium tabular-nums">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function fmtDate(iso: string | null): string {
  return iso ? iso.slice(0, 10) : "—";
}

export default async function AdminPage() {
  const supabase = createAdminClient();

  const [
    { data: waitlist },
    { data: profiles },
    { data: projects },
    { count: purchaseCount },
    { count: activeSubs },
  ] = await Promise.all([
    supabase
      .from("waitlist")
      .select(
        "email, source, confirmed_at, created_at, test_access, access_granted_at",
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("id, email, plan, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("projects").select("user_id"),
    supabase
      .from("purchases")
      .select("id", { count: "exact", head: true })
      .is("refunded_at", null),
    supabase
      .from("subscriptions")
      .select("user_id", { count: "exact", head: true })
      .in("status", ["active", "trialing"]),
  ]);

  const wl = waitlist ?? [];
  const users = profiles ?? [];
  const prj = projects ?? [];

  const wlConfirmed = wl.filter((w) => w.confirmed_at).length;

  // --- QS-/Daten-Auswertungen (alle best-effort: fehlt eine Migration, liefert
  // PostgREST einen Fehler, data bleibt null und die Sektion bleibt leer) ---

  // Regenerier-Hotspots: Kapitel, die oft neu generiert wurden, zeigen, wo der
  // Kapitel-Prompt versagt — das ist unser Prompt-Verbesserungs-Signal.
  const { data: hotspots } = await supabase
    .from("chapters")
    .select("heading, generation_count, project_id")
    .gte("generation_count", 3)
    .order("generation_count", { ascending: false })
    .limit(15);

  // Amazon-Metriken: letzter + vorletzter Snapshot je veröffentlichtem Buch.
  const { data: metricRows } = await supabase
    .from("book_metrics")
    .select("project_id, captured_at, bsr, ratings_count, price_eur, ok, note")
    .order("captured_at", { ascending: false })
    .limit(300);

  // Nischen-Feedback: welche Vorschläge wurden wirklich angeklickt?
  const { data: nicheStarts } = await supabase
    .from("niche_pool")
    .select("title, starts, check_status, batch")
    .gt("starts", 0)
    .order("starts", { ascending: false })
    .limit(10);

  // Projekt-Titel für Hotspots + Metriken nachladen.
  const titleIds = [
    ...new Set([
      ...(hotspots ?? []).map((h) => h.project_id),
      ...(metricRows ?? []).map((m) => m.project_id),
    ]),
  ];
  const { data: titleRows } = titleIds.length
    ? await supabase.from("projects").select("id, title, topic").in("id", titleIds)
    : { data: [] };
  const titles = new Map(
    (titleRows ?? []).map((t) => [t.id, t.title ?? t.topic]),
  );

  // Je Buch die letzten zwei brauchbaren Snapshots (Trend).
  const metricsByProject = new Map<
    string,
    Array<NonNullable<typeof metricRows>[number]>
  >();
  for (const row of metricRows ?? []) {
    const list = metricsByProject.get(row.project_id) ?? [];
    if (list.length < 2 && row.ok) list.push(row);
    metricsByProject.set(row.project_id, list);
  }

  const projectsByUser = new Map<string, number>();
  for (const p of prj) {
    projectsByUser.set(p.user_id, (projectsByUser.get(p.user_id) ?? 0) + 1);
  }

  return (
    <div className="mt-8 space-y-12">
      <section>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Überblick
        </h1>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <Stat label="Warteliste" value={wl.length} />
          <Stat label="bestätigt" value={wlConfirmed} />
          <Stat label="Nutzer" value={users.length} />
          <Stat label="aktive Abos" value={activeSubs ?? 0} />
          <Stat label="Buch-Käufe" value={purchaseCount ?? 0} />
          <Stat label="Projekte" value={prj.length} />
        </div>
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold">Nutzer ({users.length})</h2>
        {users.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Noch keine Nutzer.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border border-t border-border">
            {users.map((u) => (
              <li
                key={u.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">
                    {u.email ?? "—"}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    registriert {fmtDate(u.created_at)} ·{" "}
                    {projectsByUser.get(u.id) ?? 0} Projekt(e) ·{" "}
                    {u.plan === "paid" ? "bezahlt/Abo" : "kostenlos"}
                  </span>
                </span>
                <PlanToggle userId={u.id} plan={u.plan} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {metricsByProject.size > 0 ? (
        <section>
          <h2 className="font-display text-lg font-semibold">
            Amazon-Metriken (veröffentlichte Bücher)
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Täglicher Snapshot aus dem Cron — Bestseller-Rang, Bewertungen,
            Preis. Trend gegenüber dem vorherigen Snapshot in Klammern.
          </p>
          <ul className="mt-4 divide-y divide-border border-t border-border">
            {[...metricsByProject.entries()].map(([projectId, snaps]) => {
              const [latest, prev] = snaps;
              if (!latest) return null;
              const bsrDelta =
                prev?.bsr != null && latest.bsr != null
                  ? latest.bsr - prev.bsr
                  : null;
              const ratingsDelta =
                prev?.ratings_count != null && latest.ratings_count != null
                  ? latest.ratings_count - prev.ratings_count
                  : null;
              return (
                <li key={projectId} className="py-3">
                  <span className="block text-sm font-medium">
                    {titles.get(projectId) ?? projectId}
                  </span>
                  <span className="block text-xs text-muted-foreground tabular-nums">
                    {latest.bsr != null
                      ? `BSR ${latest.bsr.toLocaleString("de-DE")}${
                          bsrDelta != null
                            ? ` (${bsrDelta <= 0 ? "▲" : "▼"} ${Math.abs(bsrDelta).toLocaleString("de-DE")})`
                            : ""
                        }`
                      : "BSR —"}
                    {" · "}
                    {latest.ratings_count != null
                      ? `${latest.ratings_count.toLocaleString("de-DE")} Bewertungen${
                          ratingsDelta ? ` (+${ratingsDelta})` : ""
                        }`
                      : "Bewertungen —"}
                    {" · "}
                    {latest.price_eur != null
                      ? `${Number(latest.price_eur).toFixed(2).replace(".", ",")} €`
                      : "Preis —"}
                    {" · "}
                    {fmtDate(latest.captured_at)}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {(hotspots ?? []).length > 0 ? (
        <section>
          <h2 className="font-display text-lg font-semibold">
            Regenerier-Hotspots
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Kapitel mit ≥ 3 Generierungsläufen — hier liefert der Kapitel-Prompt
            offenbar nicht, was Nutzer wollen (Prompt-Verbesserungs-Signal).
          </p>
          <ul className="mt-4 divide-y divide-border border-t border-border">
            {(hotspots ?? []).map((h, i) => (
              <li
                key={i}
                className="flex items-center justify-between gap-3 py-2.5"
              >
                <span className="min-w-0 truncate text-sm">
                  {h.heading}
                  <span className="ml-2 text-xs text-muted-foreground">
                    {titles.get(h.project_id) ?? ""}
                  </span>
                </span>
                <span className="shrink-0 text-sm font-medium tabular-nums">
                  {h.generation_count}×
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {(nicheStarts ?? []).length > 0 ? (
        <section>
          <h2 className="font-display text-lg font-semibold">
            Nischen-Vorschläge: Klicks
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            „Dieses Buch starten“-Klicks pro Nische — welche Vorschläge ziehen.
          </p>
          <ul className="mt-4 divide-y divide-border border-t border-border">
            {(nicheStarts ?? []).map((n, i) => (
              <li
                key={i}
                className="flex items-center justify-between gap-3 py-2.5"
              >
                <span className="min-w-0 truncate text-sm">
                  {n.title}
                  <span className="ml-2 text-xs text-muted-foreground">
                    Batch {n.batch} · {n.check_status}
                  </span>
                </span>
                <span className="shrink-0 text-sm font-medium tabular-nums">
                  {n.starts}×
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section>
        <h2 className="font-display text-lg font-semibold">
          Warteliste-Anmeldungen ({wl.length})
        </h2>
        {wl.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Noch keine Anmeldungen.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-border border-t border-border">
            {wl.map((w) => (
              <li
                key={w.email}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">
                    {w.email}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {fmtDate(w.created_at)} · {w.source ?? "—"} ·{" "}
                    {w.confirmed_at ? "bestätigt" : "offen"}
                  </span>
                </span>
                <WaitlistGrant
                  email={w.email}
                  invited={Boolean(w.test_access)}
                  granted={Boolean(w.access_granted_at)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
