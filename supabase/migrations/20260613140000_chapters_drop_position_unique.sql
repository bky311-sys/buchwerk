-- Migration: relax chapter ordering for the outline editor
-- Created:   2026-06-13
-- Purpose:   The outline editor reorders, adds and deletes chapters and then
--            renumbers positions 1..N from application code. The strict
--            unique(project_id, position) constraint made row-by-row
--            renumbering fail on intermediate duplicate positions, so we drop
--            it. Ordering still uses the position column (+ chapters_project_id_idx).

alter table public.chapters
  drop constraint if exists chapters_project_id_position_key;
