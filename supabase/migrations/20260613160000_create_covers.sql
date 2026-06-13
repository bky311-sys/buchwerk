-- Migration: create public.covers + storage bucket "covers"
-- Created:   2026-06-13
-- Purpose:   Cover drafts per project (Flux via Replicate). Images are stored
--            in the public "covers" storage bucket; this table keeps the
--            metadata. RLS via project owner. Inserts/storage writes happen
--            through the service-role client (bypasses RLS).
--
-- Note: the public storage bucket "covers" is created via the Storage API,
-- not in this SQL file:
--   POST {project}.supabase.co/storage/v1/bucket  {name:"covers", public:true}

create table if not exists public.covers (
  id           uuid        primary key default gen_random_uuid(),
  project_id   uuid        not null references public.projects (id) on delete cascade,
  storage_path text        not null,
  image_url    text        not null,
  prompt       text,
  model        text,
  is_selected  boolean     not null default false,
  created_at   timestamptz not null default now()
);
create index if not exists covers_project_idx on public.covers (project_id, created_at desc);

alter table public.covers enable row level security;

create policy "covers_select_own" on public.covers
  for select to authenticated
  using (exists (select 1 from public.projects p
                 where p.id = covers.project_id and p.user_id = (select auth.uid())));
create policy "covers_insert_own" on public.covers
  for insert to authenticated
  with check (exists (select 1 from public.projects p
                      where p.id = covers.project_id and p.user_id = (select auth.uid())));
create policy "covers_update_own" on public.covers
  for update to authenticated
  using (exists (select 1 from public.projects p
                 where p.id = covers.project_id and p.user_id = (select auth.uid())))
  with check (exists (select 1 from public.projects p
                      where p.id = covers.project_id and p.user_id = (select auth.uid())));
create policy "covers_delete_own" on public.covers
  for delete to authenticated
  using (exists (select 1 from public.projects p
                 where p.id = covers.project_id and p.user_id = (select auth.uid())));

comment on table public.covers is 'Cover drafts per project; images in the public covers storage bucket.';
