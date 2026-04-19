-- Migration: create public.waitlist
-- Created:   2026-04-18
-- Purpose:   Waitlist table used by the landing-page forms on buchwerk.info
--            (hero and footer). Captures email plus minimal context for the
--            launch announcement and rough attribution.

create table if not exists public.waitlist (
  id          uuid        primary key default gen_random_uuid(),
  email       text        not null unique,
  source      text,
  user_agent  text,
  created_at  timestamptz not null default now()
);

create index if not exists waitlist_created_at_idx
  on public.waitlist (created_at desc);

-- Row Level Security
alter table public.waitlist enable row level security;

-- INSERT policy: anonymous visitors and authenticated users may add entries.
-- This is the only write path that non-service-role clients have.
create policy "waitlist_insert_public"
  on public.waitlist
  for insert
  to anon, authenticated
  with check (true);

-- Intentionally NO select/update/delete policies:
--   * anon/authenticated cannot read the list, preventing scraping.
--   * only the service_role key (which bypasses RLS) can read/modify.
--   * admin views / exports will run server-side with the service_role client.

comment on table public.waitlist is
  'Pre-launch waitlist entries from buchwerk.info. RLS: INSERT only for anon/authenticated, no read access.';
