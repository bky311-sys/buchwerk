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
    supabase.from("purchases").select("id", { count: "exact", head: true }),
    supabase
      .from("subscriptions")
      .select("user_id", { count: "exact", head: true })
      .in("status", ["active", "trialing"]),
  ]);

  const wl = waitlist ?? [];
  const users = profiles ?? [];
  const prj = projects ?? [];

  const wlConfirmed = wl.filter((w) => w.confirmed_at).length;

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
