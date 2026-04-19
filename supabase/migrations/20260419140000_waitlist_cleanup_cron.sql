-- Migration: schedule hourly cleanup of unconfirmed waitlist entries
-- Created:   2026-04-19
-- Purpose:   Deliver on the datenschutz promise that unconfirmed entries
--            are removed within 48 hours. Threshold is 47h combined with a
--            once-per-hour cron cadence, so in the worst case an entry lives
--            ~47h17min — safely under the 48h commitment.
-- Depends:   pg_cron extension must be enabled beforehand (one click in the
--            Supabase dashboard under Database → Extensions → pg_cron).

-- Idempotent: drop any existing job with the same name before rescheduling.
do $$
begin
  if exists (
    select 1 from cron.job where jobname = 'cleanup_unconfirmed_waitlist'
  ) then
    perform cron.unschedule('cleanup_unconfirmed_waitlist');
  end if;
end $$;

-- Schedule: every hour at minute 17 (staggered away from the top-of-hour rush).
-- Query: delete any unconfirmed row whose last activity (confirmation sent or
-- creation timestamp if the send never happened) is older than 47 hours.
select cron.schedule(
  'cleanup_unconfirmed_waitlist',
  '17 * * * *',
  $$
    delete from public.waitlist
    where confirmed_at is null
      and coalesce(confirmation_sent_at, created_at) < now() - interval '47 hours'
  $$
);
