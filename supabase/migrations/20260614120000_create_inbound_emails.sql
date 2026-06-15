-- Migration: create public.inbound_emails
-- Created:   2026-06-14
-- Purpose:   Mirror of incoming mail to welcome@buchwerk.info. A scheduled
--            IMAP poller reads the All-inkl mailbox and upserts each message
--            here so the admin Posteingang can display it. No DNS/MX change —
--            the mailbox keeps working unchanged; we only read it.
-- Dedup:     message_id (the RFC Message-ID header) is unique, so re-polling
--            the same mailbox never creates duplicates.

create table if not exists public.inbound_emails (
  id            uuid        primary key default gen_random_uuid(),
  message_id    text,                       -- RFC 5322 Message-ID header (dedup key)
  imap_uid      bigint,                     -- IMAP UID within the mailbox (poll cursor)
  from_address  text,
  from_name     text,
  to_address    text,
  subject       text,
  text_body     text,
  html_body     text,
  received_at   timestamptz,               -- the email's own Date header
  is_read       boolean     not null default false,
  raw           jsonb,                      -- optional: extra headers / parse metadata
  created_at    timestamptz not null default now()  -- when we ingested it
);

-- Dedup across polls. A plain UNIQUE index already lets multiple NULL
-- message_ids coexist (Postgres treats NULLs as distinct), and it can serve
-- as the ON CONFLICT arbiter for upserts from the poller.
create unique index if not exists inbound_emails_message_id_uniq
  on public.inbound_emails (message_id);

-- Listing: newest first.
create index if not exists inbound_emails_received_at_idx
  on public.inbound_emails (received_at desc);

-- Unread badge / cleanup: find unread quickly.
create index if not exists inbound_emails_unread_idx
  on public.inbound_emails (is_read)
  where is_read = false;

-- Row Level Security
alter table public.inbound_emails enable row level security;

-- Intentionally NO policies for anon/authenticated:
--   * The IMAP poller writes via the service_role key (bypasses RLS).
--   * The admin Posteingang reads via the service_role key (bypasses RLS).
--   * Ordinary users must never see inbound mail.

comment on table public.inbound_emails is
  'Mirror of incoming mail to welcome@buchwerk.info, filled by the IMAP poller. RLS: no anon/authenticated access; service_role only.';
