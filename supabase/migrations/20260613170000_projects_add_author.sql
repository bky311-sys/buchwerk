-- Migration: add author to public.projects
-- Created:   2026-06-13
-- Purpose:   Author name printed on the cover PDF.

alter table public.projects
  add column if not exists author text;
