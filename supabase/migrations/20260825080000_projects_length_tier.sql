-- Umfangswahl: Kompakt (~80 S.) / Standard (~130 S.) / Premium (~200 S.).
-- Bestehende Projekte bleiben kompakt (entspricht dem bisherigen Verhalten).
alter table public.projects
  add column if not exists length_tier text not null default 'kompakt';
