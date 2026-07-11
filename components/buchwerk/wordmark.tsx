import { cn } from "@/lib/utils";

// On-brand wordmark ("Studio"): green rounded-square badge with an open-book
// glyph + "buchwerk." set in the display font (Bricolage Grotesque). The
// period keeps the primary (bottle-green) accent. No background — sits cleanly
// in headers. Wrap in a <Link> at the call site.
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-primary text-primary-foreground">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-[18px]"
          aria-hidden="true"
        >
          <path d="M12 7v14" />
          <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
        </svg>
      </span>
      <span className="font-display text-xl font-bold text-foreground">
        buchwerk<span className="text-primary">.</span>
      </span>
    </span>
  );
}
