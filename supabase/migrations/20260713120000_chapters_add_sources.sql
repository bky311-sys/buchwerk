-- Migration: add per-chapter used-sources to public.chapters
-- Created:   2026-07-13
-- Purpose:   Store the sources a chapter actually used (a JSON array of
--            {title, url}), reported by the model when the chapter is written.
--            Drives the Quellenverzeichnis in the manuscript export, grouped by
--            chapter — only genuinely used sources, not the whole dossier.
--            RLS is unchanged (owner-only via existing chapter policies).

alter table public.chapters
  add column if not exists sources jsonb not null default '[]'::jsonb;

comment on column public.chapters.sources is
  'Used sources for this chapter: JSON array of {title, url}. Filled at generation time; drives the grouped Quellenverzeichnis in the export.';
