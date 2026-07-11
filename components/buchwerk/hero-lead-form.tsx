"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

// Lead magnet: the visitor types a book topic and is taken to registration,
// which carries the topic through to the free outline. Turns the hero into the
// first step of the product instead of a passive waitlist.
export function HeroLeadForm() {
  const router = useRouter();
  const [topic, setTopic] = useState("");

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = topic.trim();
    router.push(
      value ? `/registrieren?thema=${encodeURIComponent(value)}` : "/registrieren",
    );
  }

  return (
    <form onSubmit={submit} className="w-full max-w-xl">
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="hero-topic" className="sr-only">
          Thema deines Buchs
        </label>
        <input
          id="hero-topic"
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Dein Buchthema…"
          className="h-12 flex-1 rounded-full border border-input bg-card px-5 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
        />
        <Button type="submit" size="lg" className="h-12 px-6 text-base">
          Gliederung gratis erstellen
        </Button>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Thema &amp; Gliederung kostenlos. Kein Abo-Zwang — erst zum Produzieren
        zahlst du.
      </p>
    </form>
  );
}
