-- Migration: waitlist test-access flags
-- Created:   2026-07-14
-- Purpose:   Let an admin release test access to a waitlist signup with one
--            click: test_access marks them for the auto-grant, access_granted_at
--            records when the (manual) subscription was applied on their first
--            login so it only happens once. Written only by service-role admin
--            paths; RLS is unchanged.

alter table public.waitlist
  add column if not exists test_access       boolean     not null default false,
  add column if not exists invited_at        timestamptz,
  add column if not exists access_granted_at timestamptz;

comment on column public.waitlist.test_access is
  'Admin released a full test access for this signup (drives the auto-grant on registration).';
comment on column public.waitlist.access_granted_at is
  'Set when the manual subscription was granted on first login; prevents re-granting.';
