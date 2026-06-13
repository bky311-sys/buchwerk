-- Migration: create public.kdp_listings (one listing per project, 1:1)
-- Created:   2026-06-13
-- Purpose:   KDP listing per book project — title, subtitle, description,
--            keywords, categories, price recommendation. RLS via project owner.

create table if not exists public.kdp_listings (
  project_id  uuid          primary key references public.projects (id) on delete cascade,
  title       text,
  subtitle    text,
  description text,
  keywords    text[],
  categories  text[],
  price_eur   numeric(6,2),
  price_note  text,
  created_at  timestamptz   not null default now(),
  updated_at  timestamptz   not null default now()
);

alter table public.kdp_listings enable row level security;

create policy "kdp_select_own" on public.kdp_listings
  for select to authenticated
  using (exists (select 1 from public.projects p
                 where p.id = kdp_listings.project_id and p.user_id = (select auth.uid())));
create policy "kdp_insert_own" on public.kdp_listings
  for insert to authenticated
  with check (exists (select 1 from public.projects p
                      where p.id = kdp_listings.project_id and p.user_id = (select auth.uid())));
create policy "kdp_update_own" on public.kdp_listings
  for update to authenticated
  using (exists (select 1 from public.projects p
                 where p.id = kdp_listings.project_id and p.user_id = (select auth.uid())))
  with check (exists (select 1 from public.projects p
                      where p.id = kdp_listings.project_id and p.user_id = (select auth.uid())));
create policy "kdp_delete_own" on public.kdp_listings
  for delete to authenticated
  using (exists (select 1 from public.projects p
                 where p.id = kdp_listings.project_id and p.user_id = (select auth.uid())));

drop trigger if exists kdp_listings_touch_updated_at on public.kdp_listings;
create trigger kdp_listings_touch_updated_at
  before update on public.kdp_listings
  for each row execute function public.touch_updated_at();

comment on table public.kdp_listings is 'KDP listing per project (1:1), ownership via project.';
