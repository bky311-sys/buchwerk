-- Migration: security hardening — close paywall / shop / review bypasses
-- Created:   2026-07-12
-- Purpose:   The anon key is public, so an authenticated user can call PostgREST
--            directly. RLS guards rows but not columns, which let users forge
--            business state. This migration removes those openings. The matching
--            server code writes the affected fields through the service-role
--            client instead (see lib/billing/access.ts and lib/shop/actions.ts).

-- 1) Paywall: users must not be able to grant themselves a production unlock.
--    Unlocks now come only from the Stripe webhook (purchase) and the
--    subscription gate — both service-role. Reads stay owner-scoped.
drop policy if exists "book_unlocks_insert_own" on public.book_unlocks;

-- 2) Shop/Boost: restrict which project columns authenticated users may UPDATE.
--    shop_* and boosted_until are set only by the (service-role) shop/boost
--    server logic; everything a user legitimately edits stays writable.
revoke update on public.projects from authenticated;
grant update (title, author, status, research, research_status, research_updated_at)
  on public.projects to authenticated;

-- 3) Reviews: a self-insert may only create a pending, unrewarded review.
--    Approval and point rewards run through the author-moderation path
--    (service-role), so users can't self-approve or fake ratings.
drop policy if exists "reviews_insert_own" on public.shop_reviews;
create policy "reviews_insert_own" on public.shop_reviews
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and status = 'pending'
    and rewarded = false
  );
