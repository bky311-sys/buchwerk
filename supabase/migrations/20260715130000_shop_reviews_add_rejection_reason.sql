-- Migration: rejection reason for shop reviews (Art. 17 DSA)
-- Created:   2026-07-15
-- Purpose:   Rejecting a review hides it from the shop. Under Art. 17 DSA that is
--            a "Beschränkung" and owes the affected user a clear, specific
--            statement of reasons — size-independent (Art. 19 only exempts
--            micro/small enterprises from Section 3, i.e. Art. 20 ff.).
--            rejectReviewAction now requires a reason; it is stored here and
--            shown to the reviewer together with a route to object.
--
--            Written only through the service-role moderation path; shop_reviews
--            has no UPDATE policy for authenticated users at all, so no column
--            allowlist is needed here (unlike chapters in 20260715120000).

alter table public.shop_reviews
  add column if not exists rejection_reason text;
