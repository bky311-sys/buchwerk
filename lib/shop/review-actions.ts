"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { REVIEW_LOCK_MS } from "@/lib/shop/reviews";
import { POINTS_PER_REVIEW } from "@/lib/shop/points";

export type ReviewActionResult = { ok: boolean; error?: string };

const KINDS = new Set(["pdf", "kindle", "kauf"]);

// Art. 17 DSA wants a "klare und spezifische Begründung" — short enough not to
// block the author, long enough to rule out "nein".
const MIN_REJECTION_REASON = 15;

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

  const { data: inserted, error } = await supabase
    .from("shop_reviews")
    .insert({
      book_id: bookId,
      user_id: user.id,
      rating,
      body: body.trim() || null,
    })
    .select("id")
    .single();
  if (error) {
    // Unique(book_id, user_id) → already reviewed.
    if (error.code === "23505") {
      return { ok: false, error: "Du hast dieses Buch bereits bewertet." };
    }
    return { ok: false, error: "Konnte die Bewertung nicht speichern." };
  }

  // Credit points HERE, on submission — never on the author's approval.
  //
  // The reviewed author must not decide whether the reviewer gets paid. Gating
  // the payout on their approval makes the reward de facto sentiment-dependent
  // (a 2-star review can simply be rejected), which is exactly the "Hoffnung,
  // weiter am Programm teilnehmen zu können" that OLG Frankfurt 6 U 232/21 held
  // to be an unlawful sachfremder Einfluss — and it would defeat the
  // sentiment-neutrality that Modell A is built on (docs/BUCHSHOP.md).
  //
  // Points are therefore credited once per review, independent of the rating and
  // independent of any later moderation. Abuse is handled by the operator
  // revoking points (negative ledger entry), not by the author withholding them.
  await admin.from("point_ledger").insert({
    user_id: user.id,
    delta: POINTS_PER_REVIEW,
    reason: "review_submitted",
    review_id: inserted.id,
  });
  await admin
    .from("shop_reviews")
    .update({ rewarded: true })
    .eq("id", inserted.id);

  if (book.shop_slug) revalidatePath(`/buchshop/${book.shop_slug}`);
  return { ok: true };
}

// Verifies the caller owns the book behind a review, then returns the review's
// book_id + reviewer id via the admin client. Null if not the owner.
async function authorizeModeration(
  reviewId: string,
  callerId: string,
): Promise<{ bookId: string; reviewerId: string } | null> {
  const admin = createAdminClient();
  const { data: review } = await admin
    .from("shop_reviews")
    .select("id, book_id, user_id")
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
  };
}

// Author approves a review for publication. Deliberately does NOT touch points —
// the reviewer was already credited on submission (see submitReviewAction). This
// action only controls visibility, never the reward.
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
    })
    .eq("id", reviewId);
  if (error) return { ok: false, error: "Konnte nicht freigeben." };

  revalidatePath(`/projekte/${ctx.bookId}`);
  return { ok: true };
}

// Author rejects a pending review, hiding it from the shop. Points already
// credited on submission are deliberately NOT clawed back — otherwise rejection
// would again make the reward sentiment-dependent through the back door.
// TODO(Art. 17 DSA): a rejection is a "Beschränkung" and owes the reviewer a
// reasoned notice. Tracked in docs/LESEN-UND-BEWERTEN.md §3.5.
export async function rejectReviewAction(
  reviewId: string,
  reason: string,
): Promise<ReviewActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Bitte melde dich an." };

  // Art. 17 DSA: the reason is not optional. A bare "rejected" would leave the
  // reviewer with no idea what happened and nothing to object to.
  const trimmed = reason.trim();
  if (trimmed.length < MIN_REJECTION_REASON) {
    return {
      ok: false,
      error: `Bitte begründe die Ablehnung in mindestens ${MIN_REJECTION_REASON} Zeichen — der Leser bekommt die Begründung zu sehen.`,
    };
  }

  const ctx = await authorizeModeration(reviewId, user.id);
  if (!ctx) return { ok: false, error: "Bewertung nicht gefunden." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("shop_reviews")
    .update({ status: "rejected", rejection_reason: trimmed })
    .eq("id", reviewId);
  if (error) return { ok: false, error: "Konnte nicht ablehnen." };

  revalidatePath(`/projekte/${ctx.bookId}`);
  return { ok: true };
}
