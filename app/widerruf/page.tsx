import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Widerrufsbelehrung — Buchwerk",
};

export default function WiderrufPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-20">
      <h1 className="text-3xl font-medium tracking-tight">Widerrufsbelehrung</h1>
      <p className="mt-6 rounded-lg border border-border bg-muted p-4 text-sm text-muted-foreground">
        Platzhalter. Die rechtsgültige Widerrufsbelehrung wird vor dem Live-Gang
        von einem Rechtsdienst erstellt und hier eingesetzt.
      </p>
      <div className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground">
        <p>[WIDERRUFSBELEHRUNG]</p>
        <p>
          Vorzeitiges Erlöschen des Widerrufsrechts: Das Widerrufsrecht erlischt
          bei einem Vertrag über die Bereitstellung digitaler Inhalte, wenn du
          ausdrücklich zugestimmt hast, dass mit der Ausführung vor Ablauf der
          Widerrufsfrist begonnen wird, und du deine Kenntnis davon bestätigt
          hast, dass du durch deine Zustimmung mit Beginn der Ausführung dein
          Widerrufsrecht verlierst (§ 356 Abs. 5 BGB).
        </p>
      </div>
    </main>
  );
}
