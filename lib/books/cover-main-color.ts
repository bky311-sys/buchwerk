import "server-only";

import { averagePngColor } from "@/lib/books/image-color";
import { NEUTRAL_MAIN, type RGB } from "@/lib/books/cover-style";

// The motif's dominant colour, used to derive the title-band colour so the shop
// preview matches the real (downloaded) cover. Best-effort: fetches the stored
// motif PNG and averages it; falls back to a neutral tone on any failure.
// Cached per-URL in-process so re-renders (and the shop list) don't refetch.
const cache = new Map<string, RGB>();

export async function getCoverMainColor(url: string | null): Promise<RGB> {
  if (!url) return NEUTRAL_MAIN;
  const cached = cache.get(url);
  if (cached) return cached;
  try {
    const res = await fetch(url);
    if (!res.ok) return NEUTRAL_MAIN;
    const bytes = new Uint8Array(await res.arrayBuffer());
    const color = averagePngColor(bytes);
    const rgb: RGB = color ?? NEUTRAL_MAIN;
    cache.set(url, rgb);
    return rgb;
  } catch {
    return NEUTRAL_MAIN;
  }
}
