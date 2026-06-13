import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AGB — Buchwerk",
};

export default function AgbPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-20">
      <h1 className="text-3xl font-medium tracking-tight">
        Allgemeine Geschäftsbedingungen
      </h1>
      <p className="mt-6 rounded-lg border border-border bg-muted p-4 text-sm text-muted-foreground">
        Platzhalter. Die endgültigen AGB werden vor dem Live-Gang von einem
        Rechtsdienst (z. B. IT-Recht Kanzlei / Händlerbund / Trusted Shops)
        erstellt und hier eingesetzt.
      </p>
      <div className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground">
        <p>[AGB-TEXT]</p>
        <p>
          Hinweis zu digitalen Inhalten: Die Leistung wird auf ausdrücklichen
          Wunsch sofort erbracht; das Widerrufsrecht erlischt mit Beginn der
          Ausführung (§ 356 Abs. 5 BGB). Details siehe Widerrufsbelehrung.
        </p>
      </div>
    </main>
  );
}
