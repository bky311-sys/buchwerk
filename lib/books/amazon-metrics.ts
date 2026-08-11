import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

// Daily snapshots (BSR, ratings, price) for published books with an amazon_url,
// collected by the daily cron into book_metrics. This is the ground-truth
// feedback loop: which niches/listings actually sell. Best-effort by design —
// Amazon blocks datacenter fetches at will (503/robot check); a blocked day is
// recorded as ok=false and simply yields a gap, never an error path.
//
// Deliberately plain `fetch` with browser-ish headers, no scraping library
// (pnpm-lock.yaml is not regenerable, see lib/ai/anthropic.ts) and no retries —
// hammering would only get the IP blocked faster. If blocks become permanent,
// the clean upgrade path is the PA-API (Associates account exists).

const FETCH_TIMEOUT_MS = 10_000;
const MAX_BOOKS_PER_RUN = 20;

export type MetricsRunResult = {
  ok: boolean;
  collected: number;
  blocked: number;
  skipped: number;
};

type ParsedMetrics = {
  bsr: number | null;
  ratings_count: number | null;
  rating: number | null;
  price_eur: number | null;
};

// "1.234" / "1.234.567" → 1234567 (German thousands separators).
function parseGermanInt(raw: string): number | null {
  const n = Number.parseInt(raw.replace(/[.,\s]/g, ""), 10);
  return Number.isFinite(n) ? n : null;
}

// "4,3" → 4.3
function parseGermanFloat(raw: string): number | null {
  const n = Number.parseFloat(raw.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/** Extracts BSR, rating count, average rating and price from an amazon.de product page. */
export function parseAmazonProductPage(rawHtml: string): ParsedMetrics {
  // Amazon rendert Zahlen mit &nbsp;-Entities und in verschachtelten Spans —
  // erst normalisieren, sonst greifen die Muster nicht (im Livebetrieb
  // verifiziert: Preis/Bewertungszahl waren sonst durchgängig null).
  const html = rawHtml
    .replace(/&nbsp;| /g, " ")
    .replace(/&#8364;|&euro;/g, "€");

  // BSR: "Nr. 12.345 in Bücher / Kindle-Shop" ist der Gesamtrang; daneben
  // stehen kleinere Subkategorie-Ränge ("Nr. 3 in Ratgeber X"). Wir nehmen den
  // größten gefundenen Rang — der Gesamtrang kommt aus dem größten Pool.
  const bsrMatches = [...html.matchAll(/Nr\.\s*([\d.]+)\s+in\s+/g)]
    .map((m) => parseGermanInt(m[1]))
    .filter((n): n is number => n !== null);
  const bsr = bsrMatches.length ? Math.max(...bsrMatches) : null;

  // Ratings count: "1.234 Sternebewertungen" / "1.234 globale Bewertungen"
  const ratingsMatch = html.match(
    /([\d.]+)\s+(?:globale\s+)?(?:Sternebewertung|Bewertung)/,
  );
  // Average: "4,3 von 5 Sternen"
  const ratingMatch = html.match(/([\d,]+)\s+von\s+5\s+Sternen/);

  // Price. Kindle-Unlimited-Titel zeigen prominent "0,00 €" — der Kaufpreis
  // steht als "oder <span class=a-color-price>7,99 €" daneben. Reihenfolge:
  // a-color-price → häufigster Nicht-Null-Preis der Seite → null.
  // Erster Nicht-Null-Treffer: das KU-Angebot "0,00 €" steht oft davor.
  let price: number | null = null;
  for (const m of html.matchAll(/a-color-price">\s*(\d{1,3},\d{2})\s*€/g)) {
    const value = parseGermanFloat(m[1]);
    if (value) {
      price = value;
      break;
    }
  }
  if (!price) {
    const counts = new Map<number, number>();
    for (const m of html.matchAll(/(\d{1,3},\d{2})\s*€/g)) {
      const value = parseGermanFloat(m[1]);
      if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
    }
    price =
      [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  }

  return {
    bsr,
    ratings_count: ratingsMatch ? parseGermanInt(ratingsMatch[1]) : null,
    rating: ratingMatch ? parseGermanFloat(ratingMatch[1]) : null,
    price_eur: price,
  };
}

async function fetchProductPage(
  url: string,
): Promise<{ status: number; html: string } | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
        "accept-language": "de-DE,de;q=0.9",
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
    const html = await res.text();
    return { status: res.status, html };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Collects one metrics snapshot per published book (max 20 per run). One row
 * per book per run, ok=false with a note when Amazon blocked or parsing found
 * nothing usable.
 */
export async function collectBookMetrics(): Promise<MetricsRunResult> {
  const admin = createAdminClient();

  const { data: books, error } = await admin
    .from("projects")
    .select("id, amazon_url")
    .not("amazon_url", "is", null)
    .not("published_at", "is", null)
    .limit(MAX_BOOKS_PER_RUN);
  if (error) return { ok: false, collected: 0, blocked: 0, skipped: 0 };

  let collected = 0;
  let blocked = 0;
  let skipped = 0;

  for (const book of books ?? []) {
    const url = book.amazon_url?.trim();
    if (!url || !/^https?:\/\/(www\.)?amazon\./i.test(url)) {
      skipped += 1;
      continue;
    }

    const page = await fetchProductPage(url);
    const isBlocked =
      !page ||
      page.status === 503 ||
      page.status === 403 ||
      /captcha|Roboter|automatisierte Zugriffe/i.test(
        page.html.slice(0, 5_000),
      );

    if (isBlocked) {
      blocked += 1;
      await admin.from("book_metrics").insert({
        project_id: book.id,
        ok: false,
        note: page ? `blockiert (${page.status})` : "Timeout/Netzwerkfehler",
      });
    } else {
      const parsed = parseAmazonProductPage(page.html);
      const empty =
        parsed.bsr === null &&
        parsed.ratings_count === null &&
        parsed.rating === null;
      await admin.from("book_metrics").insert({
        project_id: book.id,
        ...parsed,
        ok: !empty,
        note: empty ? "Seite geladen, keine Kennzahlen gefunden" : null,
      });
      collected += 1;
    }

    // Kein Hammering: kurze Pause zwischen den Abrufen.
    await new Promise((resolve) => setTimeout(resolve, 1_500));
  }

  return { ok: true, collected, blocked, skipped };
}
