-- Migration: add imprint (Impressum) fields to public.projects
-- Created:   2026-07-12
-- Purpose:   Books sold via KDP in Germany need an imprint page (name + postal
--            address of the responsible person). These fields are collected from
--            the author and rendered into the manuscript PDF. RLS is unchanged;
--            the columns are added to the authenticated UPDATE grant so the
--            owner can edit them (the security migration restricted UPDATE to a
--            column allow-list).

alter table public.projects
  add column if not exists imprint_name   text,
  add column if not exists imprint_street text,
  add column if not exists imprint_zip    text,
  add column if not exists imprint_city   text;

grant update (imprint_name, imprint_street, imprint_zip, imprint_city)
  on public.projects to authenticated;

comment on column public.projects.imprint_name is
  'Imprint: name of the responsible person/publisher (Impressumspflicht).';
