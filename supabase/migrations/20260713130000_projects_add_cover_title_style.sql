-- Migration: add cover title style to public.projects
-- Created:   2026-07-13
-- Purpose:   Let the author choose how the title/author band is placed on the
--            front cover (position + tone), so the text doesn't cover the
--            important part of the motif. Drives both the live preview and the
--            cover PDF. RLS unchanged (owner-only via existing policies).

alter table public.projects
  add column if not exists cover_title_style text not null default 'klassisch';

comment on column public.projects.cover_title_style is
  'Front-cover title band style: klassisch (dark, bottom) | kopf (dark, top) | hell (light, bottom).';
