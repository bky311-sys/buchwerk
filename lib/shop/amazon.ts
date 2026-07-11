// Builds the outbound Amazon link for a shop book. If AMAZON_PARTNER_TAG is set
// (Vercel env), the affiliate tag is appended to Amazon URLs; otherwise the raw
// link is returned unchanged. Non-Amazon URLs are never rewritten.
export function buildAmazonUrl(rawUrl: string): string {
  const tag = process.env.AMAZON_PARTNER_TAG;
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
