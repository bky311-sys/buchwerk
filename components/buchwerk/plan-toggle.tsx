"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { setUserPlanAction } from "@/lib/admin/actions";

export function PlanToggle({
  userId,
  plan,
}: {
  userId: string;
  plan: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isPaid = plan === "paid";

  function toggle() {
    startTransition(async () => {
      await setUserPlanAction(userId, isPaid ? "free" : "paid");
      router.refresh();
    });
  }

  return (
    <Button
      type="button"
      variant={isPaid ? "secondary" : "outline"}
      size="sm"
      disabled={isPending}
      onClick={toggle}
    >
      {isPending
        ? "…"
        : isPaid
          ? "bezahlt → auf kostenlos"
          : "als bezahlt markieren"}
    </Button>
  );
}
