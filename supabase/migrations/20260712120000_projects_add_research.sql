-- Migration: add research dossier columns to public.projects
-- Created:   2026-07-12
-- Purpose:   Store a per-book research dossier (markdown, incl. source list)
--            produced with Claude's web search tool, plus its generation state
--            so the UI can show a spinner and poll — same pattern as chapter
--            generation. RLS is unchanged (owner-only via existing policies).

alter table public.projects
  add column if not exists research            text,
  add column if not exists research_status     text        not null default 'offen',
  add column if not exists research_updated_at timestamptz;

comment on column public.projects.research is
  'Research dossier (markdown, incl. sources) written with web search.';
comment on column public.projects.research_status is
  'offen | läuft | fertig | fehler — drives the research spinner/poller.';
comment on column public.projects.research_updated_at is
  'Set when research_status changes; used for stale-generation detection.';
