import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Widerrufsbelehrung — Buchwerk",
};

type Block = { title: string; paragraphs: string[] };

const BLOCKS: Block[] = [
  {
    title: "Widerrufsrecht",
    paragraphs: [
      "Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen.",
      "Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag des Vertragsschlusses.",
      "Um Ihr Widerrufsrecht auszuüben, müssen Sie uns (Benjamin Koch, buchwerk.info, Friedrichstraße 33, 58791 Werdohl, E-Mail: welcome@buchwerk.info) mittels einer eindeutigen Erklärung (z. B. ein mit der Post versandter Brief oder eine E-Mail) über Ihren Entschluss, diesen Vertrag zu widerrufen, informieren. Sie können dafür das untenstehende Muster-Widerrufsformular verwenden, das jedoch nicht vorgeschrieben ist.",
      "Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die Mitteilung über die Ausübung des Widerrufsrechts vor Ablauf der Widerrufsfrist absenden.",
    ],
  },
  {
    title: "Folgen des Widerrufs",
    paragraphs: [
      "Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen erhalten haben, unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über Ihren Widerruf dieses Vertrags bei uns eingegangen ist. Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel, das Sie bei der ursprünglichen Transaktion eingesetzt haben, es sei denn, mit Ihnen wurde ausdrücklich etwas anderes vereinbart; in keinem Fall werden Ihnen wegen dieser Rückzahlung Entgelte berechnet.",
    ],
  },
  {
    title: "Vorzeitiges Erlöschen des Widerrufsrechts",
    paragraphs: [
      "Das Widerrufsrecht erlischt bei einem Vertrag über die Bereitstellung digitaler Inhalte bzw. digitaler Dienstleistungen, wenn wir mit der Ausführung begonnen haben, nachdem Sie ausdrücklich zugestimmt haben, dass wir mit der Ausführung vor Ablauf der Widerrufsfrist beginnen, und Sie Ihre Kenntnis davon bestätigt haben, dass Sie durch Ihre Zustimmung mit Beginn der Ausführung Ihr Widerrufsrecht verlieren (§ 356 Abs. 5 BGB).",
      "Diese Zustimmung und Bestätigung holen wir vor der Freischaltung über die entsprechenden Kontrollkästchen im Bezahlvorgang ein.",
    ],
  },
];

export default function WiderrufPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-20">
      <h1 className="font-display text-3xl font-bold tracking-tight">Widerrufsbelehrung</h1>

      <div className="mt-10 space-y-8">
        {BLOCKS.map((block) => (
          <section key={block.title}>
            <h2 className="font-display text-lg font-semibold">{block.title}</h2>
            <div className="mt-2 space-y-2 text-base leading-relaxed text-muted-foreground">
              {block.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </section>
        ))}

        <section>
          <h2 className="font-display text-lg font-semibold">Muster-Widerrufsformular</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            (Wenn Sie den Vertrag widerrufen wollen, füllen Sie dieses Formular
            aus und senden Sie es zurück.)
          </p>
          <div className="mt-4 space-y-2 rounded-lg border border-border bg-muted p-5 text-base leading-relaxed text-muted-foreground">
            <p>An: Benjamin Koch, buchwerk.info, Friedrichstraße 33, 58791 Werdohl, welcome@buchwerk.info</p>
            <p>
              Hiermit widerrufe(n) ich/wir den von mir/uns abgeschlossenen
              Vertrag über die folgende digitale Dienstleistung:
            </p>
            <p>— Bestellt am / freigeschaltet am: ____________________</p>
            <p>— Name des/der Verbraucher(s): ____________________</p>
            <p>— Anschrift des/der Verbraucher(s): ____________________</p>
            <p>— Datum: ____________________</p>
            <p>
              — Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf
              Papier): ____________________
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
