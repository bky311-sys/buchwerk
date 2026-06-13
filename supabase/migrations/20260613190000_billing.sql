-- Migration: billing (subscriptions, purchases, book_unlocks) + profiles.stripe_customer_id
-- Created:   2026-06-13
-- Purpose:   Stripe billing. profiles.stripe_customer_id links a user to a
--            Stripe customer. subscriptions/purchases are written by the
--            webhook (service-role). book_unlocks gates production per project.

alter table public.profiles
  add column if not exists stripe_customer_id text;

create table if not exists public.subscriptions (
  user_id                uuid        primary key references auth.users (id) on delete cascade,
  stripe_customer_id     text,
  stripe_subscription_id text,
  status                 text        not null default 'inactive',
  current_period_start   timestamptz,
  current_period_end     timestamptz,
  updated_at             timestamptz not null default now()
);
alter table public.subscriptions enable row level security;
create policy "subscriptions_select_own" on public.subscriptions
  for select to authenticated using ((select auth.uid()) = user_id);

create table if not exists public.purchases (
  id                         uuid        primary key default gen_random_uuid(),
  user_id                    uuid        not null references auth.users (id) on delete cascade,
  project_id                 uuid        references public.projects (id) on delete set null,
  stripe_checkout_session_id text        unique,
  amount_cents               int,
  created_at                 timestamptz not null default now()
);
alter table public.purchases enable row level security;
create policy "purchases_select_own" on public.purchases
  for select to authenticated using ((select auth.uid()) = user_id);

create table if not exists public.book_unlocks (
  id           uuid        primary key default gen_random_uuid(),
  project_id   uuid        not null references public.projects (id) on delete cascade,
  user_id      uuid        not null references auth.users (id) on delete cascade,
  source       text        not null,
  period_start timestamptz,
  created_at   timestamptz not null default now(),
  unique (project_id)
);
create index if not exists book_unlocks_sub_period_idx
  on public.book_unlocks (user_id, period_start) where source = 'subscription';
alter table public.book_unlocks enable row level security;
create policy "book_unlocks_select_own" on public.book_unlocks
  for select to authenticated
  using (exists (select 1 from public.projects p
                 where p.id = book_unlocks.project_id and p.user_id = (select auth.uid())));
create policy "book_unlocks_insert_own" on public.book_unlocks
  for insert to authenticated
  with check (exists (select 1 from public.projects p
                      where p.id = book_unlocks.project_id and p.user_id = (select auth.uid())));
