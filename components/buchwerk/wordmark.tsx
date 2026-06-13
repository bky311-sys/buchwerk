import { cn } from "@/lib/utils";

// On-brand wordmark: open-book glyph + "buchwerk." in the brand font.
// The period uses the primary (bottle-green) accent. No background — sits
// cleanly in headers. Wrap in a <Link> at the call site.
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-5 shrink-0 text-primary"
        aria-hidden="true"
      >
        <path d="M12 7v14" />
        <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
      </svg>
      <span className="text-lg font-medium tracking-tight text-foreground">
        buchwerk<span className="text-primary">.</span>
      </span>
    </span>
  );
}
