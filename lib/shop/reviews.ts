import "server-only";
import type { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

// The 2-hour reading lock: a review may only be submitted this long after the
// reader marked the book as "being read" (shop_acquisitions.acquired_at).
export const REVIEW_LOCK_MS = 2 * 60 * 60 * 1000;

export type PublicReview = {
  id: string;
  rating: number;
  body: string | null;
  createdAt: string;
  rewarded: boolean;
};

export type ReviewSummary = { count: number; average: number };

export type UserReviewState = {
  acquiredAt: string | null;
  canReviewAt: number | null; // epoch ms, or null if not acquired yet
  hasReviewed: boolean;
  reviewStatus: string | null; // 'pending' | 'approved' | 'rejected'
};

export type PendingReview = {
  id: string;
  rating: number;
  body: string | null;
  createdAt: string;
};

// Approved reviews for public display. Read via service-role so no anon policy
// is needed; reviewer identity is intentionally not exposed.
export async function getApprovedReviews(
  bookId: string,
): Promise<PublicReview[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("shop_reviews")
    .select("id, rating, body, created_at, rewarded")
    .eq("book_id", bookId)
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  return (data ?? []).map((r) => ({
    id: r.id,
    rating: r.rating,
    body: r.body,
    createdAt: r.created_at,
    rewarded: r.rewarded,
  }));
}

export function summarize(reviews: PublicReview[]): ReviewSummary {
  if (reviews.length === 0) return { count: 0, average: 0 };
  const sum = reviews.reduce((s, r) => s + r.rating, 0);
  return {
    count: reviews.length,
    average: Math.round((sum / reviews.length) * 10) / 10,
  };
}

// The current user's relationship to a book: has it been marked as read, may a
// review be submitted yet, was one already left. Uses the user-context client.
export async function getUserReviewState(
  supabase: SupabaseClient,
  bookId: string,
  userId: string,
): Promise<UserReviewState> {
  const [{ data: acq }, { data: review }] = await Promise.all([
    supabase
      .from("shop_acquisitions")
      .select("acquired_at")
      .eq("book_id", bookId)
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("shop_reviews")
      .select("status")
      .eq("book_id", bookId)
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  const acquiredAt = acq?.acquired_at ?? null;
  return {
    acquiredAt,
    canReviewAt: acquiredAt
      ? new Date(acquiredAt).getTime() + REVIEW_LOCK_MS
      : null,
    hasReviewed: Boolean(review),
    reviewStatus: review?.status ?? null,
  };
}

// Pending reviews for one book, for author moderation. Ownership of the book
// must be verified by the caller before showing these.
export async function getPendingReviewsForAuthor(
  bookId: string,
): Promise<PendingReview[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("shop_reviews")
    .select("id, rating, body, created_at")
    .eq("book_id", bookId)
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  return (data ?? []).map((r) => ({
    id: r.id,
    rating: r.rating,
    body: r.body,
    createdAt: r.created_at,
  }));
}
