// Our Amazon Associates partner tag. Every outbound shop link carries it so the
// affiliate commission is attributed to us — regardless of what link the author
// stored. Overridable via the AMAZON_PARTNER_TAG env var.
const PARTNER_TAG = process.env.AMAZON_PARTNER_TAG ?? "meinersterh0c-21";

// Builds the outbound Amazon link for a shop book: forces our partner tag onto
// Amazon URLs (dropping any tag the author may have set). Non-Amazon URLs are
// never rewritten.
export function buildAmazonUrl(rawUrl: string): string {
  const tag = PARTNER_TAG;
  if (!tag) return rawUrl;
  try {
    const url = new URL(rawUrl);
    if (!/(^|\.)amazon\./i.test(url.hostname)) return rawUrl;
    url.searchParams.set("tag", tag);
    return url.toString();
  } catch {
    return rawUrl;
  }
}
