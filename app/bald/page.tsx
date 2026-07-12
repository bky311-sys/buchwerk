import type { Metadata } from "next";
import { Wordmark } from "@/components/buchwerk/wordmark";
import { WaitlistForm } from "@/components/buchwerk/waitlist-form";

export const metadata: Metadata = {
  title: "Bald verfügbar — buchwerk.",
  description:
    "Buchwerk schreibt dein Buch mit KI — recherchiert, vollständig, KDP-fertig. Bald verfügbar. Trag dich ein und sei zum Start dabei.",
  robots: { index: false, follow: false },
};

export default function BaldPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-24">
      <div className="w-full max-w-lg text-center">
        <div className="flex justify-center">
          <Wordmark />
        </div>
        <p className="mt-10 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          Bald verfügbar
        </p>
        <h1 className="font-display mt-4 text-4xl font-extrabold leading-[1.02] tracking-tight text-foreground sm:text-5xl">
          Schreib dein Buch mit KI.
        </h1>
        <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-muted-foreground">
          Buchwerk recherchiert dein Thema, schreibt ein vollständiges
          Manuskript, gestaltet das Cover und liefert das fertige KDP-Listing —
          auf Deutsch, in einem Werkzeug. Wir öffnen bald.
        </p>
        <p className="mx-auto mt-6 max-w-md text-sm text-foreground">
          Sei zum Start dabei — wir sagen dir als Erstes Bescheid.
        </p>
        <div className="mt-4 flex justify-center">
          <WaitlistForm source="coming_soon" />
        </div>
      </div>
    </main>
  );
}
