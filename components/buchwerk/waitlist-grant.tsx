"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { grantWaitlistAccessAction } from "@/lib/admin/waitlist-actions";

// Admin button: release full test access to a waitlist signup (marks them for
// the auto-grant on registration and mails them the preview-token link).
export function WaitlistGrant({
  email,
  invited,
  granted,
}: {
  email: string;
  invited: boolean;
  granted: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (granted) {
    return (
      <span className="shrink-0 text-xs font-medium text-success">
        Zugang aktiv ✓
      </span>
    );
  }

  function grant() {
    startTransition(async () => {
      await grantWaitlistAccessAction(email);
      router.refresh();
    });
  }

  return (
    <Button
      type="button"
      variant={invited ? "outline" : "secondary"}
      size="sm"
      disabled={isPending}
      onClick={grant}
    >
      {isPending
        ? "…"
        : invited
          ? "Zugangs-Link erneut senden"
          : "Testzugang freigeben"}
    </Button>
  );
}
