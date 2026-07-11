-- Migration: Buchshop Phase 3 — Punkte einlösen (Buch "boosten")
-- Created:   2026-07-11
-- Purpose:   Autoren lösen interne Punkte ein, um ihr veröffentlichtes Buch für
--            eine Weile im Buchshop hervorzuheben ("Sucht Bewertungen"). Punkte
--            bleiben ein internes Instrument — es entsteht KEIN Geldwert. Die
--            Einlösung wird als negativer point_ledger-Eintrag verbucht.

alter table public.projects
  add column if not exists boosted_until timestamptz;

-- Aktive Boosts schnell finden (Shop-Sortierung / "Sucht Bewertungen").
create index if not exists projects_boosted_until_idx
  on public.projects (boosted_until desc)
  where boosted_until is not null;

comment on column public.projects.boosted_until is
  'Bis wann das Buch im Buchshop hervorgehoben ist (per Punkte-Einlösung). Kein Geldwert.';
