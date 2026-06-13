"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { generateChapterAction } from "@/lib/books/actions";

type Props = {
  chapterId: string;
  hasContent: boolean;
};

export function ChapterGenerator({ chapterId, hasContent }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run() {
    setError(null);
    startTransition(async () => {
      const result = await generateChapterAction(chapterId);
      if (result.ok) {
        router.refresh();
      } else {
        setError(result.error ?? "Etwas ist schiefgelaufen.");
      }
    });
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant={hasContent ? "outline" : "default"}
        size="lg"
        onClick={run}
        disabled={isPending}
      >
        {isPending
          ? "Wird geschrieben… (kann ~30 Sek. dauern)"
          : hasContent
            ? "Kapitel neu schreiben"
            : "Kapitel schreiben"}
      </Button>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
