-- Migration: allow authenticated owners to UPDATE cover_title_style
-- Created:   2026-07-14
-- Purpose:   The security_hardening migration restricted UPDATE on
--            public.projects to a column allow-list. cover_title_style was added
--            afterwards (20260713130000) without a matching grant, so the owner's
--            "Titel-Stil" save failed with an insufficient-privilege error. Add
--            the column to the authenticated UPDATE grant (same pattern as the
--            imprint fields). RLS policies are unchanged.

grant update (cover_title_style) on public.projects to authenticated;
