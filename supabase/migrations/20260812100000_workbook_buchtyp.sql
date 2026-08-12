-- Migration: Workbook als zweites Buchformat (Maßnahmenplan 12.08.)
--
-- projects.book_type steuert Gliederungs- und Kapitel-Prompts sowie das
-- Rendering der Übungselemente ([UEBUNG], "- [ ]"-Checklisten, [NOTIZFELD n])
-- in Manuskript-PDF und EPUB. 'ratgeber' ist der bisherige Standard und
-- verhält sich exakt wie vorher.

alter table public.projects
  add column if not exists book_type text not null default 'ratgeber';

alter table public.projects drop constraint if exists projects_book_type_chk;
alter table public.projects add constraint projects_book_type_chk
  check (book_type in ('ratgeber', 'workbook'));

-- Spalten-Grants explizit nachziehen (Härtungs-Falle vom 01.08.: ein REVOKE
-- löscht ALLE Spalten-Grants — neue Spalten brauchen ihre eigenen).
grant select (book_type) on public.projects to authenticated, anon;
grant insert (book_type) on public.projects to authenticated;
