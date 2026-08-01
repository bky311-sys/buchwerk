-- Migration: Nischen-Pool für die "Keine Idee?"-Vorschläge
-- Created:   2026-08-01
--
-- Ein wöchentlicher Cron (app/api/cron/nischen) recherchiert per Web-Search
-- Buchnischen in diese Tabelle; das Neues-Buch-Formular serviert sie Nutzern
-- ohne eigene Idee. Bewusst vorberechnet statt Live-Recherche pro Nutzer:
-- einmal Recherchekosten pro Woche statt pro Klick, kein ungedeckelter
-- KI-Endpunkt (vgl. Entscheidungslog zu §6a-Kostenrisiken).
--
-- Alte Batches bleiben stehen (Verlauf/Vergleich); die UI liest nur den
-- neuesten Batch.

create table if not exists public.niche_pool (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,                     -- Nischen-Titel ("Stressfrei Autofahren mit Hund")
  audience    text not null,                     -- Zielgruppe in einem Satz
  pitch       text not null,                     -- 1–2 Sätze: warum die Nische funktioniert
  demand      text not null default 'mittel',    -- Nachfrage: hoch | mittel | niedrig
  competition text not null default 'mittel',    -- Konkurrenz: niedrig | mittel | hoch
  interests   text[] not null default '{}',      -- Filter-Tags aus der festen Liste in lib/books/niche-pool.ts
  book_type   text not null default 'ratgeber',  -- ratgeber | sachbuch
  topic_prompt text not null,                    -- vorbefüllter Text fürs Themenfeld
  batch       date not null,                     -- Datum des Cron-Laufs
  created_at  timestamptz not null default now()
);

create index if not exists niche_pool_batch_idx on public.niche_pool (batch desc);

alter table public.niche_pool enable row level security;

-- Lesen: nur eingeloggte Nutzer (das Feature sitzt hinter dem Login).
-- Schreiben: ausschließlich Service-Role (keine Insert/Update/Delete-Policies).
create policy "niche_pool_select_authenticated"
  on public.niche_pool for select to authenticated using (true);
