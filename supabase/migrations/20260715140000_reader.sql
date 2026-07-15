-- Migration: Buchwerk-Reader — Lesefreigabe + Lesefortschritt
-- Created:   2026-07-15
-- Purpose:   Buchwerk owns the manuscript (chapters.content). That is the one
--            thing Rezenzo/Pubby structurally cannot do: they mail a PDF and go
--            blind. Reading in our own reader turns "the reader says they read
--            it" into something we can actually measure — which is what Anhang
--            Nr. 23b UWG calls "angemessene und verhältnismäßige Maßnahmen zur
--            Überprüfung", and the measure is judged against what is possible
--            FOR US. See docs/LESEN-UND-BEWERTEN.md §5.1.

-- 1) Reading is a SEPARATE opt-in from being listed in the shop.
--    shop_published = shop window (low barrier — we want many books).
--    shop_readable  = the author hands the full text to logged-in subscribers.
--    Rule: who wants to be reviewed has to let people read. No readability →
--    the listing stays a card with an Amazon link, but collects no reviews.
--    Default false: an already-listed book must never silently become readable.
alter table public.projects
  add column if not exists shop_readable boolean not null default false;

-- shop_readable is set only through the (service-role) shop logic, exactly like
-- the other shop_* columns. The allowlist from 20260712130000 already excludes
-- it — repeated here as the single source of truth for what users may write.
revoke update on public.projects from authenticated;
grant update (title, author, status, research, research_status, research_updated_at)
  on public.projects to authenticated;

-- 2) Reading progress, one row per (reader, chapter).
--    seconds_active counts only heartbeats sent while the tab was visible AND
--    recently interacted with — wall-clock time would make an open tab a valid
--    "read" (the Medium read-ratio failure mode).
create table if not exists public.reading_progress (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters(id) on delete cascade,
  book_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  -- Furthest scroll depth reached in this chapter, 0..1.
  max_scroll numeric not null default 0 check (max_scroll >= 0 and max_scroll <= 1),
  -- Accumulated active seconds. Written server-side only.
  seconds_active integer not null default 0 check (seconds_active >= 0),
  first_opened_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (chapter_id, user_id)
);

create index if not exists reading_progress_book_user_idx
  on public.reading_progress (book_id, user_id);

alter table public.reading_progress enable row level security;

-- Readers may see their own progress. They may NOT write it: seconds_active and
-- max_scroll are the evidence a review is gated on, so a PATCH from the public
-- anon key would forge the very thing we are trying to prove. All writes go
-- through the heartbeat route with the service-role client.
create policy "reading_progress_select_own" on public.reading_progress
  for select to authenticated
  using ((select auth.uid()) = user_id);
