-- Migration: add double opt-in columns to public.waitlist
-- Created:   2026-04-19
-- Purpose:   Extend waitlist table to support Double-Opt-In confirmation flow.
--            New rows start with confirmed_at=NULL and a unique confirmation_token;
--            users click a link, server-side code flips confirmed_at to now().
--            Unconfirmed entries older than a chosen TTL (e.g. 48h) can be pruned.

alter table public.waitlist
  add column if not exists confirmation_token    text,
  add column if not exists confirmed_at          timestamptz,
  add column if not exists confirmation_sent_at  timestamptz;

-- Unique index on the token so a click-through cannot collide with another entry.
-- NULLs are allowed (existing rows predating this migration have none) and do not
-- count towards uniqueness per PostgreSQL semantics.
create unique index if not exists waitlist_confirmation_token_uniq
  on public.waitlist (confirmation_token)
  where confirmation_token is not null;

-- Partial index for cleanup jobs: find unconfirmed rows by age quickly.
create index if not exists waitlist_unconfirmed_sent_at_idx
  on public.waitlist (confirmation_sent_at)
  where confirmed_at is null;

comment on column public.waitlist.confirmation_token is
  'Single-use random token used in the Double-Opt-In confirmation link.';
comment on column public.waitlist.confirmed_at is
  'Timestamp when the user clicked the confirmation link. NULL means unconfirmed.';
comment on column public.waitlist.confirmation_sent_at is
  'Timestamp when the confirmation email was last dispatched (used for rate-limiting and cleanup).';
