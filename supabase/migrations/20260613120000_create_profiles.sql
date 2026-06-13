-- Migration: create public.profiles
-- Created:   2026-06-13
-- Purpose:   User profile row linked 1:1 to auth.users. Created automatically
--            on signup via trigger, removed via cascade when the auth user is
--            deleted. Holds app-level user data outside the auth schema.
--            RLS: each user may read and update only their own row.

create table if not exists public.profiles (
  id            uuid        primary key references auth.users (id) on delete cascade,
  email         text,
  display_name  text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Row Level Security
alter table public.profiles enable row level security;

-- SELECT: a user may read only their own profile.
-- (select auth.uid()) is wrapped in a subselect so the planner caches it
-- per statement instead of re-evaluating it per row.
create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

-- UPDATE: a user may update only their own profile.
create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Intentionally NO insert/delete policies:
--   * rows are created by the on-signup trigger below (security definer,
--     bypasses RLS), never by clients directly.
--   * rows are removed via the auth.users foreign-key cascade.

-- Auto-create a profile whenever a new auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep updated_at fresh on every profile update.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

comment on table public.profiles is
  'User profiles, 1:1 with auth.users. Auto-created on signup via trigger. RLS: owner-only read/update.';
