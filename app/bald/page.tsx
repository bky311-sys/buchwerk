import type { Metadata } from "next";
import { Wordmark } from "@/components/buchwerk/wordmark";

export const metadata: Metadata = {
  title: "Bald verfügbar — buchwerk.",
  description: "Buchwerk ist bald für dich da.",
  robots: { index: false, follow: false },
};

export default function BaldPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-24">
      <div className="text-center">
        <div className="flex justify-center">
          <Wordmark />
        </div>
        <h1 className="mt-8 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Bald verfügbar.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
          Wir arbeiten gerade an Buchwerk. Die Plattform ist bald für dich da —
          schau einfach demnächst wieder vorbei.
        </p>
      </div>
    </main>
  );
}
