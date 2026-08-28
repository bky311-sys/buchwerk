-- Automatische Überarbeitung nach dem Qualitätsbericht: Status + Kurzbilanz
-- ("Score 62 → 84, 18 Befunde bearbeitet"). Geschrieben wird über den
-- Admin-Client, gelesen vom eingeloggten Nutzer — deshalb select-Grant
-- (Lehre 26.08.: Spalten-Grants wachsen bei ALTER TABLE nicht mit).
alter table public.projects
  add column if not exists revision_status text not null default 'idle',
  add column if not exists revision_updated_at timestamptz,
  add column if not exists revision_note text;

grant select (revision_status, revision_updated_at, revision_note)
  on public.projects to authenticated;

-- Zeitstempel der letzten automatischen Überarbeitung je Kapitel: macht den
-- Lauf idempotent (bereits überarbeitete Kapitel werden übersprungen).
alter table public.chapters
  add column if not exists revised_at timestamptz;

grant select (revised_at), update (revised_at) on public.chapters to authenticated;
