-- Migration: create public.projects and public.chapters
-- Created:   2026-06-13
-- Purpose:   First book pipeline. A project is one book; chapters belong to a
--            project. RLS: a user may only touch their own projects and the
--            chapters under them (chapter ownership flows through the project).

-- == projects ==
create table if not exists public.projects (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users (id) on delete cascade,
  title       text,
  topic       text        not null,
  audience    text,
  status      text        not null default 'entwurf',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists projects_user_id_idx on public.projects (user_id, created_at desc);

alter table public.projects enable row level security;

create policy "projects_select_own" on public.projects
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "projects_insert_own" on public.projects
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "projects_update_own" on public.projects
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "projects_delete_own" on public.projects
  for delete to authenticated using ((select auth.uid()) = user_id);

drop trigger if exists projects_touch_updated_at on public.projects;
create trigger projects_touch_updated_at
  before update on public.projects
  for each row execute function public.touch_updated_at();

-- == chapters ==
create table if not exists public.chapters (
  id          uuid        primary key default gen_random_uuid(),
  project_id  uuid        not null references public.projects (id) on delete cascade,
  position    int         not null,
  heading     text        not null,
  summary     text,
  content     text,
  status      text        not null default 'offen',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (project_id, position)
);
create index if not exists chapters_project_id_idx on public.chapters (project_id, position);

alter table public.chapters enable row level security;

-- Ownership flows through the parent project.
create policy "chapters_select_own" on public.chapters
  for select to authenticated
  using (exists (select 1 from public.projects p
                 where p.id = chapters.project_id and p.user_id = (select auth.uid())));
create policy "chapters_insert_own" on public.chapters
  for insert to authenticated
  with check (exists (select 1 from public.projects p
                      where p.id = chapters.project_id and p.user_id = (select auth.uid())));
create policy "chapters_update_own" on public.chapters
  for update to authenticated
  using (exists (select 1 from public.projects p
                 where p.id = chapters.project_id and p.user_id = (select auth.uid())))
  with check (exists (select 1 from public.projects p
                      where p.id = chapters.project_id and p.user_id = (select auth.uid())));
create policy "chapters_delete_own" on public.chapters
  for delete to authenticated
  using (exists (select 1 from public.projects p
                 where p.id = chapters.project_id and p.user_id = (select auth.uid())));

drop trigger if exists chapters_touch_updated_at on public.chapters;
create trigger chapters_touch_updated_at
  before update on public.chapters
  for each row execute function public.touch_updated_at();

comment on table public.projects is 'Book projects, owner-only RLS.';
comment on table public.chapters is 'Chapters of a book project, ownership via parent project.';
