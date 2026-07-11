"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { REVIEW_LOCK_MS } from "@/lib/shop/reviews";
import { POINTS_PER_REVIEW } from "@/lib/shop/points";

export type ReviewActionResult = { ok: boolean; error?: string };

const KINDS = new Set(["pdf", "kindle", "kauf"]);

// Marks a published book as "being read", which starts the 2-hour lock before a
// review can be submitted. A reader cannot mark their own book.
export async function markReadingAction(
  bookId: string,
  kind: string,
): Promise<ReviewActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Bitte melde dich an." };

  const admin = createAdminClient();
  const { data: book } = await admin
    .from("projects")
    .select("user_id, shop_published, shop_slug")
    .eq("id", bookId)
    .maybeSingle();
  if (!book || !book.shop_published) {
    return { ok: false, error: "Buch nicht gefunden." };
  }
  if (book.user_id === user.id) {
    return { ok: false, error: "Du kannst dein eigenes Buch nicht bewerten." };
  }

  const { error } = await supabase
    .from("shop_acquisitions")
    .upsert(
      {
        book_id: bookId,
        user_id: user.id,
        kind: KINDS.has(kind) ? kind : "kauf",
      },
      { onConflict: "book_id,user_id", ignoreDuplicates: true },
    );
  if (error) return { ok: false, error: "Konnte nicht gespeichert werden." };

  if (book.shop_slug) revalidatePath(`/buchshop/${book.shop_slug}`);
  return { ok: true };
}

// Submits a review for a published book. Requires: not the reader's own book,
// the book marked as read at least 2 hours ago, and no existing review.
export async function submitReviewAction(
  bookId: string,
  rating: number,
  body: string,
): Promise<ReviewActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Bitte melde dich an." };

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { ok: false, error: "Bitte gib 1 bis 5 Sterne." };
  }

  const admin = createAdminClient();
  const { data: book } = await admin
    .from("projects")
    .select("user_id, shop_published, shop_slug")
    .eq("id", bookId)
    .maybeSingle();
  if (!book || !book.shop_published) {
    return { ok: false, error: "Buch nicht gefunden." };
  }
  if (book.user_id === user.id) {
    return { ok: false, error: "Du kannst dein eigenes Buch nicht bewerten." };
  }

  const { data: acq } = await supabase
    .from("shop_acquisitions")
    .select("acquired_at")
    .eq("book_id", bookId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!acq) {
    return {
      ok: false,
      error: "Markiere das Buch zuerst als gelesen, dann kannst du bewerten.",
    };
  }
  const unlockAt = new Date(acq.acquired_at).getTime() + REVIEW_LOCK_MS;
  if (Date.now() < unlockAt) {
    return {
      ok: false,
      error:
        "Bewertungen sind erst 2 Stunden nach dem Start möglich — damit das Buch wirklich gelesen wird.",
    };
  }

  const { error } = await supabase.from("shop_reviews").insert({
    book_id: bookId,
    user_id: user.id,
    rating,
    body: body.trim() || null,
  });
  if (error) {
    // Unique(book_id, user_id) → already reviewed.
    if (error.code === "23505") {
      return { ok: false, error: "Du hast dieses Buch bereits bewertet." };
    }
    return { ok: false, error: "Konnte die Bewertung nicht speichern." };
  }

  if (book.shop_slug) revalidatePath(`/buchshop/${book.shop_slug}`);
  return { ok: true };
}

// Verifies the caller owns the book behind a review, then returns the review's
// book_id + reviewer id via the admin client. Null if not the owner.
async function authorizeModeration(
  reviewId: string,
  callerId: string,
): Promise<{ bookId: string; reviewerId: string; rewarded: boolean } | null> {
  const admin = createAdminClient();
  const { data: review } = await admin
    .from("shop_reviews")
    .select("id, book_id, user_id, rewarded")
    .eq("id", reviewId)
    .maybeSingle();
  if (!review) return null;

  const { data: book } = await admin
    .from("projects")
    .select("user_id")
    .eq("id", review.book_id)
    .maybeSingle();
  if (!book || book.user_id !== callerId) return null;

  return {
    bookId: review.book_id,
    reviewerId: review.user_id,
    rewarded: review.rewarded,
  };
}

// Author approves a review. On first approval the reviewer is credited points
// (sentiment-neutral: same points regardless of the star rating).
export async function approveReviewAction(
  reviewId: string,
): Promise<ReviewActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Bitte melde dich an." };

  const ctx = await authorizeModeration(reviewId, user.id);
  if (!ctx) return { ok: false, error: "Bewertung nicht gefunden." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("shop_reviews")
    .update({
      status: "approved",
      approved_at: new Date().toISOString(),
      rewarded: true,
    })
    .eq("id", reviewId);
  if (error) return { ok: false, error: "Konnte nicht freigeben." };

  // Credit points only once, and independent of the rating.
  if (!ctx.rewarded) {
    await admin.from("point_ledger").insert({
      user_id: ctx.reviewerId,
      delta: POINTS_PER_REVIEW,
      reason: "review_approved",
      review_id: reviewId,
    });
  }

  revalidatePath(`/projekte/${ctx.bookId}`);
  return { ok: true };
}

// Author rejects a pending review. No points are credited.
export async function rejectReviewAction(
  reviewId: string,
): Promise<ReviewActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Bitte melde dich an." };

  const ctx = await authorizeModeration(reviewId, user.id);
  if (!ctx) return { ok: false, error: "Bewertung nicht gefunden." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("shop_reviews")
    .update({ status: "rejected" })
    .eq("id", reviewId);
  if (error) return { ok: false, error: "Konnte nicht ablehnen." };

  revalidatePath(`/projekte/${ctx.bookId}`);
  return { ok: true };
}
