-- Migration: create public.outbound_emails
-- Created:   2026-07-15
-- Purpose:   Log of mail Buchwerk SENDS via Resend (waitlist confirmation,
--            withdrawal receipts, beta-access invites, …) so the admin can see
--            outgoing mail next to the inbound Posteingang. Resend has no
--            reliable "list all sent" endpoint, so we record each send here.
-- Note:      Auth/DOI/welcome mails go through Supabase Auth (not Resend) and
--            are NOT captured here.

create table if not exists public.outbound_emails (
  id          uuid        primary key default gen_random_uuid(),
  to_email    text,
  subject     text,
  kind        text,                       -- e.g. 'waitlist_confirmation', 'access_invite', 'withdrawal_receipt'
  resend_id   text,                       -- Resend message id, when available
  created_at  timestamptz not null default now()
);

-- Listing: newest first.
create index if not exists outbound_emails_created_at_idx
  on public.outbound_emails (created_at desc);

-- Row Level Security
alter table public.outbound_emails enable row level security;

-- Intentionally NO policies for anon/authenticated:
--   * Send sites write via the service_role key (bypasses RLS).
--   * The admin view reads via the service_role key (bypasses RLS).
--   * Ordinary users must never see outbound mail.

comment on table public.outbound_emails is
  'Log of mail Buchwerk sends via Resend, for the admin mail view. RLS: no anon/authenticated access; service_role only.';
