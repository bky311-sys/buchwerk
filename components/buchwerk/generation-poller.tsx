"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// While a chapter is being written, the page re-fetches itself on an interval so
// the freshly generated text and status appear without a manual reload — even if
// the original generate request never returned. Renders nothing.
export function GenerationPoller({
  active,
  intervalMs = 4000,
}: {
  active: boolean;
  intervalMs?: number;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [active, intervalMs, router]);

  return null;
}
