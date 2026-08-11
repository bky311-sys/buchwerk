-- Migration: QS-Bericht, Marktcheck, Nischen-Validierung, Amazon-Metriken
-- Created:   2026-08-11
--
-- Vier Bausteine des Qualitäts-/Daten-Ausbaus (siehe CLAUDE.md 2026-08-11):
--
-- 1. projects.quality_*  — KI-Qualitätsbericht über das fertige Manuskript
--    (Fire+Poll wie research_*). Geschrieben wird ausschließlich über den
--    Admin-Client, daher bewusst KEINE neuen Spalten-Grants auf projects
--    (Lehre aus 42501/REVOKE, Entscheidungslog 2026-08-01).
-- 2. projects.market_*   — Wettbewerber-Snapshot (echte Amazon-Titel, Preise,
--    Suchvorschläge) pro Projekt; speist das KDP-Listing. Ebenfalls Admin-Client.
-- 3. niche_pool-Validierung — der tägliche Cron prüft LLM-Nischenkandidaten
--    gegen echte Amazon-Zahlen; verworfene Nischen erreichen die UI nie.
--    Zusätzlich starts-Zähler ("Dieses Buch starten") für den Feedback-Loop.
-- 4. book_metrics        — tägliche Snapshots (BSR, Bewertungen, Preis) für
--    veröffentlichte Bücher mit amazon_url. Nur Service-Role (RLS ohne
--    Policies); ausgewertet im Admin.
--
-- Dazu: Lauf-Zähler als Missbrauchsbremse für die bisher ungedeckelten
-- KI-Endpunkte (Gliederung, Recherche, Listing, Cover, QS) — schließt das
-- "Noch offen" aus dem Entscheidungslog 2026-07-15. Zählung über Admin-Client,
-- daher auch hier keine Grants nötig.

-- 1 + 2: QS-Bericht + Marktcheck am Projekt
alter table public.projects add column if not exists quality_report jsonb;
alter table public.projects add column if not exists quality_status text not null default 'offen';
alter table public.projects add column if not exists quality_updated_at timestamptz;
alter table public.projects add column if not exists market_snapshot jsonb;
alter table public.projects add column if not exists market_status text not null default 'offen';
alter table public.projects add column if not exists market_updated_at timestamptz;

-- Lauf-Zähler (Missbrauchsbremse, still — vgl. CHAPTER_GENERATION_LIMIT)
alter table public.projects add column if not exists outline_runs integer not null default 0;
alter table public.projects add column if not exists research_runs integer not null default 0;
alter table public.projects add column if not exists listing_runs integer not null default 0;
alter table public.projects add column if not exists cover_runs integer not null default 0;
alter table public.projects add column if not exists quality_runs integer not null default 0;

-- 3: Nischen-Validierung + Klick-Zähler
alter table public.niche_pool add column if not exists check_status text not null default 'offen';
alter table public.niche_pool add column if not exists checked_at timestamptz;
alter table public.niche_pool add column if not exists market jsonb;
alter table public.niche_pool add column if not exists starts integer not null default 0;

create index if not exists niche_pool_check_idx
  on public.niche_pool (batch desc, check_status);

-- 4: Amazon-Metriken für veröffentlichte Bücher
create table if not exists public.book_metrics (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.projects (id) on delete cascade,
  captured_at   timestamptz not null default now(),
  bsr           integer,            -- Bestseller-Rang (Kindle-Shop oder Bücher)
  ratings_count integer,            -- Anzahl Sternebewertungen
  rating        numeric(3, 2),      -- Durchschnitt (z. B. 4.30)
  price_eur     numeric(8, 2),      -- angezeigter Preis
  ok            boolean not null default true,  -- false = Abruf blockiert/fehlgeschlagen
  note          text,               -- Fehlerhinweis (z. B. "blockiert (503)")
  constraint book_metrics_note_len check (char_length(note) <= 300)
);

create index if not exists book_metrics_project_idx
  on public.book_metrics (project_id, captured_at desc);

-- Nur Service-Role liest und schreibt (Admin-Auswertung); keine Policies.
alter table public.book_metrics enable row level security;
