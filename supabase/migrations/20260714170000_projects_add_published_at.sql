-- Migration: mark a project as published on Amazon KDP
-- Created:   2026-07-14
-- Purpose:   There is no KDP API, so the author marks the book as published
--            themselves. published_at completes the "Veröffentlichen" workflow
--            step and flips the status to "Veröffentlicht". Written via the
--            service-role admin path (like the shop_* columns), so no
--            authenticated column grant is needed. RLS is unchanged.

alter table public.projects
  add column if not exists published_at timestamptz;

comment on column public.projects.published_at is
  'Set when the author marks the book as published on Amazon KDP (manual milestone; drives the Veröffentlicht status).';
