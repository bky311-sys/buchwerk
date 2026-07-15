import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AGB — Buchwerk",
};

type Section = { title: string; paragraphs: string[] };

const STAND = "Stand: Juni 2026";

const SECTIONS: Section[] = [
  {
    title: "§ 1 Geltungsbereich und Anbieter",
    paragraphs: [
      `(1) Anbieter ist Benjamin Koch, buchwerk.info, Friedrichstraße 33, 58791 Werdohl, E-Mail: welcome@buchwerk.info (nachfolgend "Anbieter").`,
      `(2) Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle Verträge über die Nutzung der unter www.buchwerk.info bereitgestellten digitalen Dienstleistungen zwischen dem Anbieter und Verbrauchern (§ 13 BGB) sowie Unternehmern (§ 14 BGB), nachfolgend "Kunde".`,
      `(3) Abweichende Bedingungen des Kunden finden keine Anwendung, es sei denn, der Anbieter stimmt ihrer Geltung ausdrücklich in Textform zu.`,
      `(4) Maßgeblich ist die zum Zeitpunkt des Vertragsschlusses gültige Fassung dieser AGB.`,
    ],
  },
  {
    title: "§ 2 Leistungsbeschreibung",
    paragraphs: [
      `(1) Buchwerk ist eine digitale, KI-gestützte Software, mit der der Kunde Buchinhalte erstellen kann: insbesondere Gliederung, Kapiteltexte (Manuskript), Cover-Motive sowie Vorschläge für ein KDP-Listing (Titel, Beschreibung, Keywords, Kategorien, Preisempfehlung).`,
      `(2) Die Leistung wird ausschließlich digital erbracht. Ergebnisse werden im Kundenkonto bereitgestellt bzw. dort zum Abruf/Download angeboten. Ein Versand physischer Waren findet nicht statt.`,
      `(3) Der Anbieter ist kein Verlag. Er übernimmt keine Veröffentlichung, keinen Vertrieb und keinen Upload zu Amazon KDP oder anderen Plattformen. Die Veröffentlichung des erstellten Werks obliegt allein dem Kunden.`,
      `(4) Die Erstellung erfolgt mithilfe von Verfahren der künstlichen Intelligenz. Inhalte werden automatisiert generiert; der Anbieter schuldet die Bereitstellung der Funktion, nicht ein bestimmtes inhaltliches Ergebnis, eine bestimmte Qualität oder einen Verkaufserfolg.`,
    ],
  },
  {
    title: "§ 3 Registrierung und Vertragsschluss",
    paragraphs: [
      `(1) Die Nutzung erfordert ein Benutzerkonto. Der Kunde muss volljährig (mindestens 18 Jahre) und voll geschäftsfähig sein.`,
      `(2) Das Anlegen eines Buchprojekts und das Erstellen einer Gliederung sind kostenlos und unverbindlich.`,
      `(3) Kostenpflichtige Funktionen (Produktion: Kapiteltexte, Überarbeitung, Cover, KDP-Listing, PDF-Download) werden erst nach Freischaltung verfügbar. Der Kunde gibt ein verbindliches Angebot ab, indem er im Bezahlvorgang den entsprechend bezeichneten Bestell-Button (z. B. "zahlungspflichtig bestellen" / "Abo starten") anklickt.`,
      `(4) Der Vertrag kommt mit der Bestätigung des erfolgreichen Zahlungsvorgangs bzw. mit der Bereitstellung der freigeschalteten Funktion zustande. Vertragssprache ist Deutsch.`,
    ],
  },
  {
    title: "§ 4 Preise und Zahlung",
    paragraphs: [
      `(1) Es gelten die zum Zeitpunkt der Bestellung im Dienst angegebenen Preise. Alle Preise sind Endpreise in Euro und verstehen sich inklusive einer etwaig anfallenden gesetzlichen Umsatzsteuer.`,
      `(2) Angeboten werden: der einmalige Kauf der Freischaltung eines einzelnen Buchprojekts sowie ein monatliches Abonnement. Die jeweils aktuellen Preise werden vor Abschluss der Bestellung angezeigt.`,
      `(3) Die Zahlungsabwicklung erfolgt über den Zahlungsdienstleister Stripe (Stripe Payments Europe, Ltd.). Es gelten die im Bezahlvorgang angebotenen Zahlungsarten (z. B. Kreditkarte). Die Zahlung ist mit Vertragsschluss fällig.`,
      `(4) Mit Angabe der Zahlungsdaten und Abschluss der Bestellung ermächtigt der Kunde den Anbieter bzw. den Zahlungsdienstleister, den fälligen Betrag einzuziehen.`,
      `(5) Die Rechnung wird elektronisch bereitgestellt (per E-Mail und/oder im Kundenkonto). Der Kunde erklärt sich mit der elektronischen Rechnungsstellung einverstanden.`,
      `(6) Gerät der Kunde in Zahlungsverzug, ist der Anbieter berechtigt, die freigeschalteten Funktionen zu sperren und den gesetzlichen Verzugsschaden geltend zu machen.`,
    ],
  },
  {
    title: "§ 5 Abonnement, Laufzeit und Kündigung",
    paragraphs: [
      `(1) Das Abonnement berechtigt zur Freischaltung von bis zu zehn (10) Buchprojekten je Abrechnungsmonat (faire Nutzung). Darüber hinausgehende Freischaltungen sind über den Einzelkauf möglich.`,
      `(2) Das Abonnement hat eine Laufzeit von einem Monat und verlängert sich automatisch um jeweils einen weiteren Monat, sofern es nicht bis zum Ende des jeweiligen Abrechnungszeitraums gekündigt wird.`,
      `(3) Die Kündigung ist jederzeit zum Ende des laufenden Abrechnungszeitraums möglich, ohne Angabe von Gründen, z. B. per E-Mail an welcome@buchwerk.info oder über die im Konto bereitgestellte Funktion.`,
      `(4) Bereits über das Abonnement freigeschaltete Buchprojekte bleiben dem Kunden erhalten; die mit dem Abonnement verbundene Freischalt-Möglichkeit für neue Projekte endet mit Ablauf des bezahlten Zeitraums.`,
    ],
  },
  {
    title: "§ 6 Widerrufsrecht und vorzeitiges Erlöschen",
    paragraphs: [
      `(1) Verbrauchern steht ein gesetzliches Widerrufsrecht von vierzehn Tagen zu. Einzelheiten ergeben sich aus der gesonderten Widerrufsbelehrung.`,
      `(2) Bei der Bereitstellung digitaler Inhalte und digitaler Dienstleistungen erlischt das Widerrufsrecht, wenn der Anbieter mit der Ausführung begonnen hat, nachdem der Verbraucher (a) ausdrücklich zugestimmt hat, dass mit der Ausführung vor Ablauf der Widerrufsfrist begonnen wird, und (b) seine Kenntnis davon bestätigt hat, dass er durch diese Zustimmung mit Beginn der Ausführung sein Widerrufsrecht verliert (§ 356 Abs. 5 BGB). Diese Zustimmung holt der Anbieter vor der Freischaltung über entsprechende Bestätigungen im Bezahlvorgang ein.`,
      `(3) Unternehmern (§ 14 BGB) steht kein gesetzliches Widerrufsrecht zu.`,
    ],
  },
  {
    title: "§ 7 Bereitstellung und Mitwirkung",
    paragraphs: [
      `(1) Freigeschaltete Inhalte werden dem Kunden unmittelbar im Kundenkonto zur Nutzung und zum Download bereitgestellt.`,
      `(2) Der Kunde stellt sicher, dass die technischen Voraussetzungen für die Nutzung des Dienstes (insbesondere ein aktueller Webbrowser und eine funktionierende Internetverbindung) gegeben sind. Für Störungen, die auf fehlende technische Voraussetzungen beim Kunden zurückzuführen sind, haftet der Anbieter nicht.`,
      `(3) Der Kunde wirkt bei der Nutzung mit, insbesondere durch Eingabe von Thema, Zielgruppe und Anweisungen. Unvollständige oder unzutreffende Eingaben können das Ergebnis beeinträchtigen.`,
    ],
  },
  {
    title: "§ 8 KI-generierte Inhalte; Verantwortung des Kunden",
    paragraphs: [
      `(1) Die Inhalte werden automatisiert mithilfe künstlicher Intelligenz erzeugt. Der Anbieter übernimmt keine Gewähr für die inhaltliche Richtigkeit, Vollständigkeit, Aktualität oder Eignung der generierten Inhalte für einen bestimmten Zweck.`,
      `(2) Der Anbieter gewährleistet insbesondere nicht die Freiheit der generierten Inhalte von Rechten Dritter (z. B. Urheber-, Marken- oder Persönlichkeitsrechten). Der Kunde ist verpflichtet, generierte Inhalte vor einer Veröffentlichung eigenverantwortlich zu prüfen.`,
      `(3) Die Verantwortung für die Verwendung, Veröffentlichung und Verwertung der erstellten Inhalte — einschließlich der Einhaltung von Plattformregeln (z. B. Amazon KDP) und gesetzlicher Vorgaben — liegt ausschließlich beim Kunden.`,
      `(4) Der Kunde stellt den Anbieter von Ansprüchen Dritter frei, die auf einer rechtswidrigen Nutzung oder Veröffentlichung der von ihm erstellten Inhalte beruhen, soweit der Kunde die Rechtsverletzung zu vertreten hat.`,
      `(5) Der Anbieter ist berechtigt, offensichtlich rechtswidrige Inhalte zu entfernen oder Konten zu sperren.`,
      `(6) Der öffentlich zugängliche Buchshop des Anbieters (www.buchwerk.info/buchshop) ist jugendfrei und verfügt über keine Altersverifikation. Der Kunde darf dort keine pornografischen, jugendgefährdenden, gewaltverherrlichenden oder sonst nur für Erwachsene bestimmten (18+) Inhalte einstellen. Der Anbieter kann die Aufnahme solcher Bücher in den Buchshop verweigern oder sie entfernen. Die eigenständige Veröffentlichung solcher Titel über Dritt-Plattformen (z. B. Amazon KDP) mit dortiger Alterskennzeichnung bleibt hiervon unberührt.`,
    ],
  },
  {
    title: "§ 9 Nutzungsrechte",
    paragraphs: [
      `(1) An den vom Kunden mit dem Dienst erstellten Inhalten (Manuskript, Cover, Listing-Texte) erhält der Kunde, soweit gesetzlich übertragbar, das zeitlich und räumlich unbeschränkte, übertragbare Nutzungsrecht. Der Kunde darf die Inhalte insbesondere veröffentlichen und kommerziell verwerten. Eine Umsatzbeteiligung des Anbieters besteht nicht.`,
      `(2) An der Software und den darunterliegenden Systemen erwirbt der Kunde keine Rechte; diese verbleiben beim Anbieter bzw. den jeweiligen Rechteinhabern.`,
    ],
  },
  {
    title: "§ 10 Gewährleistung",
    paragraphs: [
      `(1) Für Verbraucher gelten die gesetzlichen Mängelrechte.`,
      `(2) Ist der Kunde Unternehmer, erfolgt bei einem Mangel zunächst Nacherfüllung; der Anbieter kann zwischen Beseitigung des Mangels und erneuter Erbringung der Leistung wählen.`,
      `(3) Da Inhalte automatisiert generiert werden, stellt eine nicht den subjektiven Erwartungen des Kunden entsprechende inhaltliche Ausgestaltung keinen Mangel dar, soweit die Funktion technisch bereitgestellt wurde.`,
    ],
  },
  {
    title: "§ 11 Haftung",
    paragraphs: [
      `(1) Der Anbieter haftet unbeschränkt bei Vorsatz und grober Fahrlässigkeit, bei der Verletzung von Leben, Körper oder Gesundheit sowie nach dem Produkthaftungsgesetz.`,
      `(2) Bei leicht fahrlässiger Verletzung einer wesentlichen Vertragspflicht (Pflicht, deren Erfüllung die ordnungsgemäße Durchführung des Vertrags überhaupt erst ermöglicht und auf deren Einhaltung der Kunde regelmäßig vertraut) ist die Haftung auf den vertragstypischen, vorhersehbaren Schaden begrenzt.`,
      `(3) Im Übrigen ist die Haftung ausgeschlossen.`,
      `(4) Die Haftungsbeschränkungen gelten auch zugunsten der gesetzlichen Vertreter und Erfüllungsgehilfen des Anbieters.`,
    ],
  },
  {
    title: "§ 12 Verfügbarkeit",
    paragraphs: [
      `(1) Der Anbieter bemüht sich um eine hohe Verfügbarkeit des Dienstes, schuldet diese aber nicht ununterbrochen. Wartungsarbeiten, Störungen bei Drittanbietern (z. B. KI- oder Zahlungsdienstleistern) und Ereignisse höherer Gewalt können zu vorübergehenden Einschränkungen führen.`,
      `(2) Für Ausfälle, die der Anbieter nicht zu vertreten hat, haftet er nicht.`,
    ],
  },
  {
    title: "§ 13 Benutzerkonto",
    paragraphs: [
      `(1) Der Kunde hat bei der Registrierung wahrheitsgemäße Angaben zu machen und seine Zugangsdaten vertraulich zu behandeln und vor dem Zugriff Dritter zu schützen.`,
      `(2) Der Kunde ist für Aktivitäten unter seinem Konto verantwortlich, es sei denn, er hat den Missbrauch nicht zu vertreten.`,
      `(3) Der Kunde kann die Löschung seines Kontos jederzeit verlangen. Der Anbieter kann ein Konto bei missbräuchlicher Nutzung oder erheblichen Verstößen gegen diese AGB sperren oder löschen; gesetzliche Aufbewahrungspflichten bleiben unberührt.`,
    ],
  },
  {
    title: "§ 14 Datenschutz",
    paragraphs: [
      `(1) Personenbezogene Daten werden nach Maßgabe der gesetzlichen Vorschriften (insbesondere DSGVO) verarbeitet.`,
      `(2) Einzelheiten zur Datenverarbeitung ergeben sich aus der Datenschutzerklärung des Anbieters.`,
    ],
  },
  {
    title: "§ 15 Aufrechnung und Zurückbehaltung",
    paragraphs: [
      `(1) Der Kunde kann nur mit unbestrittenen oder rechtskräftig festgestellten Forderungen aufrechnen.`,
      `(2) Ein Zurückbehaltungsrecht steht dem Kunden nur zu, soweit seine Gegenforderung auf demselben Vertragsverhältnis beruht.`,
    ],
  },
  {
    title: "§ 16 Vertragstextspeicherung und Vertragssprache",
    paragraphs: [
      `(1) Der Anbieter speichert den Vertragstext und macht die Bestelldaten im Kundenkonto zugänglich. Diese AGB können auf der Website jederzeit abgerufen und gespeichert werden.`,
      `(2) Vertrags- und Kommunikationssprache ist Deutsch.`,
    ],
  },
  {
    title: "§ 17 Änderungen dieser AGB",
    paragraphs: [
      `(1) Der Anbieter kann diese AGB mit Wirkung für die Zukunft ändern, wenn dies aus triftigem Grund (z. B. geänderte Rechtslage, technische Weiterentwicklung, Erweiterung des Leistungsangebots) erforderlich ist und der Kunde dadurch nicht unangemessen benachteiligt wird.`,
      `(2) Bei Dauerschuldverhältnissen (Abonnement) werden Änderungen dem Kunden mindestens vier Wochen vor Inkrafttreten in Textform mitgeteilt. Widerspricht der Kunde nicht innerhalb von vier Wochen, gelten die Änderungen als angenommen; hierauf wird in der Mitteilung gesondert hingewiesen. Im Widerspruchsfall besteht für beide Seiten ein Kündigungsrecht zum Wirksamwerden der Änderung.`,
    ],
  },
  {
    title: "§ 18 Übertragung",
    paragraphs: [
      `(1) Der Anbieter ist berechtigt, seine Rechte und Pflichten aus diesem Vertrag ganz oder teilweise auf einen Dritten zu übertragen, sofern dies für den Kunden zumutbar ist; der Kunde wird hierüber rechtzeitig informiert und kann in diesem Fall außerordentlich kündigen.`,
    ],
  },
  {
    title: "§ 19 Online-Streitbeilegung und Verbraucherschlichtung",
    paragraphs: [
      `(1) Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: https://ec.europa.eu/consumers/odr.`,
      `(2) Der Anbieter ist zur Teilnahme an einem Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle weder verpflichtet noch grundsätzlich bereit, bemüht sich aber, Meinungsverschiedenheiten einvernehmlich beizulegen.`,
    ],
  },
  {
    title: "§ 20 Schlussbestimmungen",
    paragraphs: [
      `(1) Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts. Zwingende verbraucherschützende Vorschriften des Staates, in dem ein Verbraucher seinen gewöhnlichen Aufenthalt hat, bleiben unberührt.`,
      `(2) Ist der Kunde Kaufmann, juristische Person des öffentlichen Rechts oder öffentlich-rechtliches Sondervermögen, ist Gerichtsstand der Sitz des Anbieters.`,
      `(3) Sollten einzelne Bestimmungen dieser AGB unwirksam sein oder werden, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.`,
    ],
  },
];

export default function AgbPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-20">
      <h1 className="font-display text-3xl font-bold tracking-tight">
        Allgemeine Geschäftsbedingungen
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">{STAND}</p>

      <div className="mt-10 space-y-8">
        {SECTIONS.map((section) => (
          <section key={section.title}>
            <h2 className="font-display text-lg font-semibold">{section.title}</h2>
            <div className="mt-2 space-y-2 text-base leading-relaxed text-muted-foreground">
              {section.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
