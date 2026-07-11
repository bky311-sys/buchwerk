import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Datenschutz — Buchwerk.info",
  description: "Datenschutzerklärung für Buchwerk.info gemäß DSGVO.",
};

const linkClass =
  "underline underline-offset-4 hover:text-foreground break-words";
const sectionTitleClass =
  "text-base font-medium uppercase tracking-[0.14em] text-foreground";
const subTitleClass = "font-display text-lg font-semibold text-foreground";
const labelClass = "text-base font-medium text-foreground";

export default function DatenschutzPage() {
  return (
    <main className="flex-1">
      <article className="mx-auto max-w-2xl px-6 py-20 sm:py-28">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Buchwerk.info
        </p>
        <h1 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Datenschutzerklärung
        </h1>

        <div className="mt-10 space-y-12 text-base leading-relaxed text-muted-foreground">
          {/* 1 */}
          <section className="space-y-6">
            <h2 className={sectionTitleClass}>1. Datenschutz auf einen Blick</h2>

            <div className="space-y-2">
              <h3 className={subTitleClass}>Allgemeine Hinweise</h3>
              <p>
                Diese Hinweise geben einen Überblick über die Verarbeitung
                personenbezogener Daten beim Besuch dieser Website.
                Personenbezogene Daten sind alle Daten, mit denen Sie
                identifiziert werden können. Detaillierte Informationen finden
                Sie in den folgenden Abschnitten.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className={subTitleClass}>
                Datenerfassung auf dieser Website
              </h3>
              <p>
                Die Datenverarbeitung erfolgt durch den Websitebetreiber.
                Kontaktdaten finden Sie unter „Verantwortliche Stelle".
              </p>
            </div>

            <div className="space-y-2">
              <h3 className={subTitleClass}>Erhebung der Daten</h3>
              <p>
                Daten entstehen durch aktive Eingabe (z. B. Formular) sowie
                automatisch durch IT-Systeme beim Seitenaufruf (Browser,
                Betriebssystem, Uhrzeit).
              </p>
            </div>

            <div className="space-y-2">
              <h3 className={subTitleClass}>Zweck der Verarbeitung</h3>
              <p>
                Sicherstellung der technischen Bereitstellung, Analyse des
                Nutzerverhaltens sowie ggf. Anbahnung oder Abwicklung von
                Verträgen.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className={subTitleClass}>Ihre Rechte</h3>
              <p>
                Auskunft, Berichtigung, Löschung, Einschränkung, Widerruf
                erteilter Einwilligungen sowie Beschwerderecht bei einer
                Aufsichtsbehörde.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className={subTitleClass}>Analyse-Tools</h3>
              <p>
                Eine statistische Auswertung kann erfolgen. Details sind in
                dieser Erklärung aufgeführt.
              </p>
            </div>
          </section>

          {/* 2 */}
          <section className="space-y-6">
            <h2 className={sectionTitleClass}>2. Hosting und Infrastruktur</h2>

            <div className="space-y-2">
              <h3 className={subTitleClass}>Hosting: Vercel</h3>
              <p>
                Wir hosten die Inhalte unserer Website bei Vercel Inc., 340 S
                Lemon Ave #4133, Walnut, CA 91789, USA. Beim Besuch der
                Website werden Logfiles einschließlich IP-Adressen erfasst.
              </p>
              <p>
                Datenschutz:{" "}
                <a
                  href="https://vercel.com/legal/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  https://vercel.com/legal/privacy-policy
                </a>
              </p>
            </div>

            <div className="space-y-2">
              <h4 className={labelClass}>Rechtsgrundlage</h4>
              <p>
                Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an stabiler
                und sicherer Darstellung). Bei Einwilligung zusätzlich Art. 6
                Abs. 1 lit. a DSGVO und § 25 TDDDG.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className={labelClass}>Datenübertragung</h4>
              <p>
                Übermittlung in die USA auf Basis von Standardvertragsklauseln
                der EU-Kommission.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className={labelClass}>Auftragsverarbeitung</h4>
              <p>
                Ein Vertrag gemäß Art. 28 DSGVO (AVV) wurde abgeschlossen.
              </p>
            </div>

            <div className="space-y-2 pt-4">
              <h3 className={subTitleClass}>Cloud-Datenbank: Supabase</h3>
              <p>
                Die Wartelistendaten werden bei Supabase Inc., 970 Toa Payoh N,
                #07-04, Singapore 318992 verarbeitet. Serverstandort: Frankfurt
                am Main.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className={labelClass}>Verarbeitete Daten</h4>
              <p>
                E-Mail-Adresse, Zeitpunkt der Eintragung, Formularquelle,
                User-Agent.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className={labelClass}>Rechtsgrundlage</h4>
              <p>Art. 6 Abs. 1 lit. a DSGVO (Einwilligung).</p>
            </div>

            <div className="space-y-2">
              <h4 className={labelClass}>Datenschutz</h4>
              <p>
                <a
                  href="https://supabase.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  https://supabase.com/privacy
                </a>
              </p>
            </div>

            <div className="space-y-2">
              <h4 className={labelClass}>Auftragsverarbeitung</h4>
              <p>Ein AVV gemäß Art. 28 DSGVO wurde abgeschlossen.</p>
            </div>

            <div className="space-y-2 pt-4">
              <h3 className={subTitleClass}>E-Mail-Versand: Resend</h3>
              <p>
                Transaktionale E-Mails (z. B. Bestätigungslinks der
                Warteliste) werden über Resend, Inc., 2261 Market Street #5039,
                San Francisco, CA 94114, USA, versendet. Die Zustellung erfolgt
                über die EU-Region (Irland).
              </p>
            </div>

            <div className="space-y-2">
              <h4 className={labelClass}>Verarbeitete Daten</h4>
              <p>E-Mail-Adresse, Zustellungsstatus, Bounce-Informationen.</p>
            </div>

            <div className="space-y-2">
              <h4 className={labelClass}>Rechtsgrundlage</h4>
              <p>
                Art. 6 Abs. 1 lit. a DSGVO (Einwilligung durch Absenden des
                Formulars).
              </p>
            </div>

            <div className="space-y-2">
              <h4 className={labelClass}>Datenschutz</h4>
              <p>
                <a
                  href="https://resend.com/legal/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  https://resend.com/legal/privacy-policy
                </a>
              </p>
            </div>

            <div className="space-y-2">
              <h4 className={labelClass}>Datenübertragung</h4>
              <p>
                Resend, Inc. hat Sitz in den USA. Die Datenübertragung erfolgt
                auf Basis der Standardvertragsklauseln der EU-Kommission. Ein
                AVV nach Art. 28 DSGVO wurde abgeschlossen.
              </p>
            </div>

            <div className="space-y-2 pt-4">
              <h3 className={subTitleClass}>Fehler-Monitoring: Sentry</h3>
              <p>
                Zur frühen Erkennung und Behebung technischer Fehler nutzen
                wir Sentry (Functional Software, Inc., 45 Fremont Street
                8th Floor, San Francisco, CA 94105, USA). Die Verarbeitung
                erfolgt in der EU-Region Frankfurt; Fehlerdaten verlassen den
                Rechenzentrumsverbund innerhalb der EU nicht.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className={labelClass}>Verarbeitete Daten</h4>
              <p>
                Fehlermeldungen mit Stack-Traces, aufgerufene URLs,
                Browser- und Betriebssystem-Informationen. IP-Adressen werden
                in der Standardkonfiguration nicht übertragen.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className={labelClass}>Rechtsgrundlage</h4>
              <p>
                Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an stabilem
                und sicherem Betrieb).
              </p>
            </div>

            <div className="space-y-2">
              <h4 className={labelClass}>Datenschutz</h4>
              <p>
                <a
                  href="https://sentry.io/privacy/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  https://sentry.io/privacy/
                </a>
              </p>
            </div>

            <div className="space-y-2">
              <h4 className={labelClass}>Auftragsverarbeitung</h4>
              <p>Ein AVV nach Art. 28 DSGVO wurde abgeschlossen.</p>
            </div>
          </section>

          {/* 3 */}
          <section className="space-y-6">
            <h2 className={sectionTitleClass}>
              3. Allgemeine Hinweise und Pflichtinformationen
            </h2>

            <div className="space-y-2">
              <h3 className={subTitleClass}>Datenschutz</h3>
              <p>
                Personenbezogene Daten werden vertraulich und entsprechend der
                gesetzlichen Vorschriften verarbeitet.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className={subTitleClass}>Verantwortliche Stelle</h3>
              <p>
                Benjamin Koch
                <br />
                Friedrichstraße 33
                <br />
                58791 Werdohl
                <br />
                E-Mail: welcome@buchwerk.info
              </p>
            </div>

            <div className="space-y-2">
              <h3 className={subTitleClass}>Speicherdauer</h3>
              <p>
                Daten werden gespeichert, bis der Zweck entfällt oder
                gesetzliche Aufbewahrungspflichten greifen.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className={subTitleClass}>Rechtsgrundlagen</h3>
              <ul className="ml-5 list-disc space-y-1">
                <li>Art. 6 Abs. 1 lit. a DSGVO (Einwilligung)</li>
                <li>Art. 6 Abs. 1 lit. b DSGVO (Vertrag)</li>
                <li>Art. 6 Abs. 1 lit. c DSGVO (rechtliche Pflicht)</li>
                <li>Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse)</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className={subTitleClass}>Empfänger von Daten</h3>
              <p>
                Weitergabe erfolgt nur bei Erforderlichkeit, gesetzlicher
                Pflicht oder berechtigtem Interesse. Auftragsverarbeiter werden
                auf Basis von AV-Verträgen eingesetzt.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className={subTitleClass}>Widerruf Ihrer Einwilligung</h3>
              <p>Einwilligungen können jederzeit widerrufen werden.</p>
            </div>

            <div className="space-y-2">
              <h3 className={subTitleClass}>Widerspruchsrecht</h3>
              <p>
                Bei Verarbeitung nach Art. 6 Abs. 1 lit. e oder f DSGVO besteht
                ein Widerspruchsrecht. Direktwerbung kann jederzeit
                widersprochen werden.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className={subTitleClass}>Beschwerderecht</h3>
              <p>Bei einer zuständigen Datenschutzaufsichtsbehörde.</p>
            </div>

            <div className="space-y-2">
              <h3 className={subTitleClass}>
                Recht auf Datenübertragbarkeit
              </h3>
              <p>
                Daten können in einem maschinenlesbaren Format bereitgestellt
                werden.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className={subTitleClass}>
                Auskunft, Berichtigung und Löschung
              </h3>
              <p>
                Recht auf Einsicht, Korrektur und Löschung gespeicherter Daten.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className={subTitleClass}>
                Recht auf Einschränkung der Verarbeitung
              </h3>
              <p>
                In bestimmten Fällen kann die Verarbeitung eingeschränkt
                werden.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className={subTitleClass}>Datensicherheit</h3>
              <p>
                SSL-/TLS-Verschlüsselung schützt die Datenübertragung.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className={subTitleClass}>E-Mail-Widerspruch</h3>
              <p>Unaufgeforderte Werbung wird untersagt.</p>
            </div>
          </section>

          {/* 4 */}
          <section className="space-y-6">
            <h2 className={sectionTitleClass}>
              4. Datenerfassung auf dieser Website
            </h2>

            <div className="space-y-2">
              <h3 className={subTitleClass}>Cookies</h3>
              <p>
                Cookies sind kleine Datenpakete, die auf dem Endgerät
                gespeichert werden.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className={subTitleClass}>Arten von Cookies</h3>
              <ul className="ml-5 list-disc space-y-1">
                <li>Session-Cookies (temporär)</li>
                <li>Persistente Cookies (dauerhaft)</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className={subTitleClass}>Funktionen</h3>
              <ul className="ml-5 list-disc space-y-1">
                <li>Technische Bereitstellung</li>
                <li>Analyse</li>
                <li>Integration externer Dienste</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className={subTitleClass}>Rechtsgrundlage</h3>
              <ul className="ml-5 list-disc space-y-1">
                <li>Art. 6 Abs. 1 lit. f DSGVO für notwendige Cookies</li>
                <li>
                  Art. 6 Abs. 1 lit. a DSGVO und § 25 TDDDG bei Einwilligung
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className={subTitleClass}>Steuerung</h3>
              <p>
                Browser-Einstellungen ermöglichen Einschränkung oder
                Deaktivierung. Funktionalität kann dadurch beeinflusst werden.
              </p>
            </div>
          </section>

          {/* 5 */}
          <section className="space-y-6">
            <h2 className={sectionTitleClass}>5. Warteliste</h2>

            <div className="space-y-2">
              <h3 className={subTitleClass}>Zweck</h3>
              <p>Einmalige Benachrichtigung zum Start von Buchwerk.</p>
            </div>

            <div className="space-y-2">
              <h3 className={subTitleClass}>
                Bestätigungsverfahren (Double-Opt-In)
              </h3>
              <p>
                Nach Absenden des Formulars schicken wir Ihnen einen
                Bestätigungslink per E-Mail. Erst mit dem Klick auf diesen
                Link gilt Ihre Einwilligung als erteilt. Einträge ohne
                Bestätigung werden spätestens nach 48 Stunden automatisch
                gelöscht.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className={subTitleClass}>Erhobene Daten</h3>
              <ul className="ml-5 list-disc space-y-1">
                <li>E-Mail-Adresse</li>
                <li>Zeitpunkt der Eintragung</li>
                <li>Herkunft des Formulars (Hero/Footer)</li>
                <li>User-Agent (Browser, Betriebssystem)</li>
                <li>
                  Zeitpunkt der Bestätigungs-E-Mail und der Bestätigung
                </li>
                <li>
                  Einmaliger Bestätigungs-Token (nur für den Link, nicht
                  auslesbar)
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className={subTitleClass}>Verwendung</h3>
              <p>
                Ausschließlich für die einmalige Start-Benachrichtigung. Keine
                Weitergabe an Dritte. Kein Newsletter, keine regelmäßigen
                E-Mails.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className={subTitleClass}>Rechtsgrundlage</h3>
              <p>Art. 6 Abs. 1 lit. a DSGVO (Einwilligung).</p>
            </div>

            <div className="space-y-2">
              <h3 className={subTitleClass}>Widerruf</h3>
              <p>
                Jederzeit per E-Mail an welcome@buchwerk.info möglich. Daten
                werden anschließend gelöscht.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className={subTitleClass}>Speicherdauer</h3>
              <p>
                Bestätigte Einträge: bis Versand der Start-Benachrichtigung
                oder Widerruf der Einwilligung. Nicht bestätigte Einträge:
                automatische Löschung spätestens nach 48 Stunden.
              </p>
            </div>
          </section>

          {/* 6 */}
          <section className="space-y-6">
            <h2 className={sectionTitleClass}>6. Nutzerkonto und Anmeldung</h2>

            <div className="space-y-2">
              <h3 className={subTitleClass}>Registrierung</h3>
              <p>
                Für die Nutzung des Dienstes legen Sie ein Konto an. Dabei
                verarbeiten wir Ihre E-Mail-Adresse und ein (verschlüsselt
                gespeichertes) Passwort. Die Daten werden bei Supabase (siehe
                Abschnitt 2) gespeichert. Rechtsgrundlage ist Art. 6 Abs. 1
                lit. b DSGVO (Vertragsanbahnung und -erfüllung).
              </p>
            </div>

            <div className="space-y-2">
              <h3 className={subTitleClass}>Anmeldung mit Google</h3>
              <p>
                Optional können Sie sich mit Ihrem Google-Konto anmelden
                (Google OAuth, Anbieter: Google Ireland Limited, Gordon House,
                Barrow Street, Dublin 4, Irland). Dabei erhalten wir Ihre
                E-Mail-Adresse zur Konto-Identifikation. Es werden nur die für
                die Anmeldung erforderlichen Daten übertragen. Rechtsgrundlage
                ist Art. 6 Abs. 1 lit. b DSGVO. Datenschutzhinweise von Google:{" "}
                <a
                  href="https://policies.google.com/privacy"
                  className={linkClass}
                  target="_blank"
                  rel="noreferrer"
                >
                  policies.google.com/privacy
                </a>
                .
              </p>
            </div>

            <div className="space-y-2">
              <h3 className={subTitleClass}>Speicherdauer</h3>
              <p>
                Kontodaten werden bis zur Löschung des Kontos gespeichert. Sie
                können die Löschung jederzeit verlangen (welcome@buchwerk.info);
                gesetzliche Aufbewahrungspflichten bleiben unberührt.
              </p>
            </div>
          </section>

          {/* 7 */}
          <section className="space-y-6">
            <h2 className={sectionTitleClass}>
              7. Buchprojekte und KI-Verarbeitung
            </h2>

            <div className="space-y-2">
              <h3 className={subTitleClass}>Verarbeitete Inhalte</h3>
              <p>
                Zur Erbringung der Leistung verarbeiten wir die von Ihnen
                eingegebenen und erstellten Inhalte (z. B. Thema, Zielgruppe,
                Gliederung, Kapiteltexte, Cover-Beschreibungen, KDP-Listing). Diese
                werden bei Supabase gespeichert (Cover-Bilder in einem
                Speicher-Bucket). Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className={subTitleClass}>
                Textgenerierung: Anthropic (Claude)
              </h3>
              <p>
                Zur Erstellung von Gliederung, Kapiteltexten und KDP-Listing
                übermitteln wir die dafür nötigen Eingaben an Anthropic, PBC,
                San Francisco, USA. Anthropic verarbeitet die Inhalte zur
                Erzeugung der Antwort. Bitte geben Sie keine sensiblen
                personenbezogenen Daten Dritter in die Eingabefelder ein.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className={subTitleClass}>Coverbilder: Replicate (Flux)</h3>
              <p>
                Zur Erzeugung von Cover-Motiven übermitteln wir den Bildprompt
                an Replicate, Inc., San Francisco, USA, das das Modell „Flux"
                betreibt.
              </p>
            </div>
          </section>

          {/* 8 */}
          <section className="space-y-6">
            <h2 className={sectionTitleClass}>8. Zahlungsabwicklung (Stripe)</h2>

            <div className="space-y-2">
              <p>
                Kostenpflichtige Käufe und Abonnements werden über Stripe
                Payments Europe, Ltd., 1 Grand Canal Street Lower, Dublin,
                Irland, abgewickelt. Bei einer Zahlung verarbeitet Stripe die
                Zahlungs- und Vertragsdaten (z. B. Name, E-Mail, Zahlungsmittel-
                bzw. Kartendaten). Die Kartendaten werden direkt von Stripe
                erhoben; wir selbst erhalten und speichern keine vollständigen
                Kartendaten, sondern nur Kauf- und Abo-Status sowie eine
                Stripe-Kundenkennung. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b
                DSGVO. Datenschutzhinweise von Stripe:{" "}
                <a
                  href="https://stripe.com/de/privacy"
                  className={linkClass}
                  target="_blank"
                  rel="noreferrer"
                >
                  stripe.com/de/privacy
                </a>
                .
              </p>
            </div>
          </section>

          {/* 9 */}
          <section className="space-y-6">
            <h2 className={sectionTitleClass}>
              9. Übermittlung in Drittländer
            </h2>
            <div className="space-y-2">
              <p>
                Einige der eingesetzten Dienste verarbeiten Daten (auch) in den
                USA: Vercel (Hosting), Anthropic (Textgenerierung), Replicate
                (Coverbilder) und Resend (E-Mail-Versand). Soweit ein
                Drittlandtransfer stattfindet, erfolgt dieser auf Grundlage der
                EU-Standardvertragsklauseln (Art. 46 DSGVO) bzw. — soweit
                einschlägig — eines Angemessenheitsbeschlusses (EU-US Data
                Privacy Framework). Supabase und Stripe verarbeiten die Daten in
                der EU (Irland).
              </p>
            </div>
          </section>
        </div>

        <p className="mt-12 text-sm">
          <Link
            href="/"
            className="text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Zurück zur Startseite
          </Link>
        </p>
      </article>
    </main>
  );
}
