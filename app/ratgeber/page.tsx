import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/buchwerk/site-header";
import { LegalFooter } from "@/components/buchwerk/legal-footer";
import { ARTIKEL } from "@/lib/ratgeber/articles";

export const metadata: Metadata = {
  title: "Ratgeber: Buch schreiben & veröffentlichen — Buchwerk",
  description:
    "Ehrliche Anleitungen rund ums Selbstveröffentlichen: Buch schreiben mit KI, Amazon KDP, Klappentext, Kosten und Gliederung — praxisnah und ohne Verkaufsnebel.",
};

export default function RatgeberPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Ratgeber
          </p>
          <h1 className="font-display mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Buch schreiben und veröffentlichen — ohne Umwege.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Anleitungen aus der Werkstatt: was beim Schreiben mit KI wirklich
            funktioniert, wie Amazon KDP tickt und woran gute Bücher hängen —
            ehrlich aufgeschrieben, damit dein Projekt nicht im Entwurfsordner
            endet.
          </p>

          <ul className="mt-10 space-y-6">
            {ARTIKEL.map((artikel) => (
              <li key={artikel.slug}>
                <Link
                  href={`/ratgeber/${artikel.slug}`}
                  className="group block rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
                >
                  <h2 className="font-display text-xl font-semibold tracking-tight group-hover:underline underline-offset-4">
                    {artikel.title}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {artikel.description}
                  </p>
                  <span className="mt-3 inline-block text-sm font-medium text-primary">
                    Weiterlesen →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </main>
      <LegalFooter />
    </>
  );
}
