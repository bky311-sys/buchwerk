-- Migration: per-chapter generation counter + column allowlist for chapters
-- Created:   2026-07-15
-- Purpose:   gateProduction consumes one slot per BOOK (book_unlocks has
--            unique(project_id)), not per generation. Once a book is unlocked,
--            chapter regeneration was unlimited and free for the user while each
--            run costs us a Claude call. This adds a silent per-chapter cap.
--
--            The counter is only meaningful if users cannot reset it. RLS guards
--            rows, not columns, and the anon key is public — so an authenticated
--            user could PATCH generation_count back to 0 through PostgREST.
--            chapters never got the column allowlist that projects received in
--            20260712130000_security_hardening.sql; it does now.

alter table public.chapters
  add column if not exists generation_count integer not null default 0;

-- Restrict which chapter columns authenticated users may UPDATE. generation_count
-- is deliberately absent: it is written only by the (service-role) generation
-- path in lib/books/generate.ts. Everything a user legitimately edits — the
-- outline editor (position/heading/summary) and the generation result
-- (content/status/sources) — stays writable.
revoke update on public.chapters from authenticated;
grant update (position, heading, summary, content, status, sources)
  on public.chapters to authenticated;
