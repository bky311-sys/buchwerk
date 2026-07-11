-- Migration: add shop columns to public.projects
-- Created:   2026-07-11
-- Purpose:   Buchshop (Phase 1). Ein Autor kann ein fertiges Buch im Buchshop
--            veröffentlichen. Es entsteht KEINE neue Tabelle — ein Shop-Buch
--            ist ein `projects`-Datensatz mit shop_published = true. Titel,
--            Cover (public bucket) und Klappentext werden automatisch aus den
--            bestehenden Daten (projects, covers, kdp_listings) übernommen.
--
-- Lesepfad: Öffentliche Shop-Seiten lesen serverseitig über den service-role
--           Client und filtern hart auf shop_published = true. Deshalb bleiben
--           die owner-only RLS-Policies unverändert — es werden KEINE anon-
--           Policies geöffnet.

alter table public.projects
  add column if not exists shop_published    boolean     not null default false,
  add column if not exists shop_published_at timestamptz,
  add column if not exists shop_slug         text,
  add column if not exists amazon_url        text;

-- Eindeutiger Slug für schöne, stabile Shop-URLs (/buchshop/<slug>).
-- Teil-Index: nur veröffentlichte Bücher brauchen einen eindeutigen Slug.
create unique index if not exists projects_shop_slug_uniq
  on public.projects (shop_slug)
  where shop_slug is not null;

-- Shop-Listing: schnelle Sortierung der veröffentlichten Bücher.
create index if not exists projects_shop_published_idx
  on public.projects (shop_published_at desc)
  where shop_published = true;

comment on column public.projects.shop_published is
  'Vom Autor im Buchshop veröffentlicht. Öffentliche Shop-Seiten lesen nur diese via service-role.';
comment on column public.projects.amazon_url is
  'Amazon/KDP-Link des veröffentlichten Buchs; Ziel des "Bei Amazon kaufen"-CTA (+ Affiliate-Tag).';
