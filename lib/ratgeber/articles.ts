// Ratgeber-Artikel für die organische Suche. Bewusst als statische Daten im
// Repo (kein CMS, keine DB): Artikel ändern sich selten, gehen durch Review wie
// Code und die Sitemap kann sie ohne Query aufzählen.
//
// Markdown-Subset wie in ChapterProse: ## Abschnitt, ### Unterpunkt, - Liste,
// **fett**, Absätze. Kein HTML.

export type Artikel = {
  slug: string;
  title: string;
  // Meta-Description und Teaser auf der Übersichtsseite (max ~155 Zeichen).
  description: string;
  // ISO-Datum der Veröffentlichung (für Article-Schema und Anzeige).
  published: string;
  content: string;
};

export const ARTIKEL: Artikel[] = [
  {
    slug: "buch-schreiben-mit-ki",
    title: "Buch schreiben mit KI: So funktioniert es wirklich",
    description:
      "Kann KI ein ganzes Buch schreiben? Was erlaubt Amazon? Der ehrliche Leitfaden: Ablauf in fünf Schritten, rechtliche Regeln und woran gute KI-Bücher zu erkennen sind.",
    published: "2026-08-05",
    content: `Ein Buch mit KI schreiben — für die einen klingt das nach Betrug, für die anderen nach der Abkürzung, auf die sie immer gewartet haben. Die Wahrheit liegt dazwischen: KI kann dir heute einen großen Teil der Schreibarbeit abnehmen, aber ein gutes Buch entsteht nur, wenn du an den richtigen Stellen selbst entscheidest. Dieser Leitfaden zeigt ehrlich, was funktioniert, was nicht — und was Amazon dazu sagt.

## Was KI heute kann — und was nicht

Moderne Sprachmodelle schreiben flüssige, gut strukturierte Texte in praktisch jedem Ton. Für Sachbücher und Ratgeber heißt das: Gliederungen, ausformulierte Kapitel, Überarbeitungen und Zusammenfassungen sind in Minuten statt Wochen machbar.

Was KI von sich aus **nicht** zuverlässig kann:

- **Fakten garantieren.** Ohne Rechercheanbindung erfinden Sprachmodelle Zahlen, Studien und Quellen — souverän formuliert, aber falsch. Für ein Buch, das ernst genommen werden soll, ist das das größte Risiko.
- **Deine Perspektive einbringen.** Ein Modell kennt weder deine Erfahrungen noch deine Haltung. Ohne deine Eingriffe entsteht austauschbarer Durchschnittstext.
- **Entscheiden, was wichtig ist.** Welche Kapitel dein Thema braucht, wo Tiefe nötig ist und wo Kürze — das bleibt deine Aufgabe.

Die Konsequenz: KI ist ein starkes Werkzeug für den Entwurf, aber du bleibst Autor und Verantwortlicher.

## Der Ablauf in fünf Schritten

### 1. Thema und Zielgruppe festlegen

Je konkreter, desto besser. „Hundeerziehung" ist ein Ozean — „stressfreies Autofahren mit dem Hund" ist ein Buch. Eine klare Zielgruppe (Ersthundebesitzer? Berufspendler mit Hund?) macht jedes spätere Kapitel schärfer.

### 2. Gliederung erstellen und prüfen

Lass dir eine Kapitelstruktur vorschlagen und prüfe sie kritisch: Fehlt ein Thema, das deine Leser garantiert erwarten? Ist die Reihenfolge logisch? Die Gliederung ist der Punkt, an dem sich Qualität entscheidet — Korrekturen kosten hier Minuten, später Tage.

### 3. Recherchieren lassen — mit echten Quellen

Der Unterschied zwischen einem generischen KI-Text und einem brauchbaren Sachbuch ist die Recherche. Gute Werkzeuge durchsuchen vor dem Schreiben das Web und stützen die Kapitel auf belegbare Fakten statt auf Modellwissen von gestern.

### 4. Kapitel schreiben und mitlesen

Lass die Kapitel einzeln entstehen und lies mit. Wo der Text zu allgemein bleibt, ergänze eigene Beispiele und Erfahrungen. Genau diese Stellen unterscheiden dein Buch später von den lieblos generierten Titeln, die der Markt zu Recht ignoriert.

### 5. Überarbeiten, formatieren, veröffentlichen

Am Ende brauchst du ein sauber formatiertes Manuskript (PDF oder EPUB), ein Cover und ein Amazon-Listing mit Titel, Klappentext, Keywords und Kategorien. Wer alles in einem Werkzeug hat, spart sich das Jonglieren zwischen fünf Programmen.

## Ist das überhaupt erlaubt? Die Amazon-Regeln

Ja — Amazon KDP erlaubt KI-gestützte Bücher ausdrücklich. Es gibt aber eine klare Pflicht: Beim Veröffentlichen musst du angeben, ob dein Buch **KI-generierte Inhalte** enthält. Amazon unterscheidet dabei zwischen „KI-generiert" (die KI hat den Text erstellt, auch wenn du überarbeitet hast) und „KI-unterstützt" (du hast geschrieben, die KI hat geholfen).

Wichtig außerdem:

- **Du bist der Autor und haftest für den Inhalt** — auch für Fehler, die die KI gemacht hat.
- **Urheberrecht:** Das fertige Manuskript gehört dir; du kannst es unter deinem Namen verkaufen.
- **Qualitätsrichtlinien:** Amazon entfernt Bücher mit offensichtlich fehlerhaftem oder irreführendem Inhalt. Ungeprüfte KI-Massenware fliegt raus.

## Woran man ein gutes KI-Buch erkennt

Der Markt ist voll mit dünnen, ungeprüften KI-Titeln — und Leser erkennen sie schnell an Rezensionen und Leseproben. Gute KI-gestützte Bücher haben drei Merkmale:

- **Recherchierte Fakten** mit nachvollziehbarer Grundlage statt erfundener Statistiken
- **Echte Substanz:** ausgeschriebene Kapitel mit konkreten Beispielen, kein aufgeblasenes Stichwortgerüst
- **Eine erkennbare Autorenstimme,** weil ein Mensch mitgelesen, entschieden und überarbeitet hat

Wenn du diese drei Punkte ernst nimmst, ist „mit KI geschrieben" kein Makel — sondern einfach eine moderne Arbeitsweise, so wie niemand mehr mit der Schreibmaschine arbeitet.

## Der schnellste Weg zum eigenen Buch

Du kannst dir den Werkzeugkasten selbst zusammenstellen: ein Chat-Modell fürs Schreiben, eine Suchmaschine für die Recherche, ein Grafikprogramm fürs Cover, ein Formatierungstool fürs PDF. Oder du nutzt ein Werkzeug, das den kompletten Weg abbildet. **Buchwerk** wurde genau dafür gebaut: Du nennst dein Thema, bekommst kostenlos Titelvorschlag und Gliederung, und Buchwerk recherchiert im Web, schreibt die Kapitel, gestaltet das Cover und liefert das fertige KDP-Listing — alles auf Deutsch, und du entscheidest an jeder Stelle mit.`,
  },
  {
    slug: "amazon-kdp-anleitung",
    title: "Amazon KDP: In 7 Schritten zum veröffentlichten Buch",
    description:
      "Amazon KDP Schritt für Schritt erklärt: Konto, Steuerinterview, Buchdetails, Manuskript, Cover, Preis und Tantiemen — die komplette Anleitung für dein erstes Buch.",
    published: "2026-08-05",
    content: `Amazon Kindle Direct Publishing (KDP) ist der mit Abstand einfachste Weg, ein eigenes Buch zu veröffentlichen: kostenlos, ohne Verlag, mit Zugang zum größten Buchmarkt der Welt. Trotzdem scheitern viele am Prozess selbst — nicht, weil er schwer ist, sondern weil niemand die Reihenfolge erklärt. Hier sind die sieben Schritte von null bis zum kaufbaren Buch.

## Schritt 1: KDP-Konto anlegen

Geh auf kdp.amazon.com und melde dich mit deinem (privaten) Amazon-Konto an oder erstelle ein neues. Danach verlangt KDP drei Dinge: deine Adresse, deine Bankverbindung (für Tantiemen) und das Steuerinterview.

## Schritt 2: Das Steuerinterview ausfüllen

Klingt einschüchternd, dauert fünf Minuten. Als in Deutschland ansässige Privatperson wählst du „Einzelperson", beantwortest die Fragen zur US-Steuerpflicht (in der Regel: keine) und gibst deine deutsche Steuer-ID an. Das Doppelbesteuerungsabkommen sorgt dafür, dass Amazon dir keine US-Quellensteuer abzieht.

## Schritt 3: Buchdetails eintragen

Hier entsteht dein Amazon-Listing — die Seite, auf der Kunden kaufen. Die wichtigsten Felder:

- **Titel und Untertitel:** Der Titel muss neugierig machen, der Untertitel darf Suchbegriffe enthalten, nach denen deine Zielgruppe wirklich sucht.
- **Beschreibung:** Dein Verkaufstext. Kein Inhaltsverzeichnis, sondern ein Text, der das Problem des Lesers anspricht und das Versprechen des Buchs formuliert.
- **7 Keywords:** Suchbegriffe, unter denen dein Buch gefunden werden soll. Denk wie ein Käufer („hund autofahren angst"), nicht wie ein Autor („mein Hundebuch").
- **2 Kategorien:** Wähl so spezifisch wie möglich — in einer kleinen Nische auf Platz 3 zu stehen bringt mehr als Platz 5.000 im großen Regal.
- **KI-Angabe:** Seit 2023 fragt Amazon, ob dein Buch KI-generierte Inhalte enthält. Beantworte das ehrlich; erlaubt ist es ausdrücklich.

## Schritt 4: Manuskript hochladen

Für Taschenbücher akzeptiert KDP am zuverlässigsten **druckfertige PDFs** mit eingebetteten Schriften; für E-Books EPUB oder DOCX. Achte auf das gewählte Buchformat (üblich: 15,24 × 22,86 cm — „6 x 9 Zoll") und ausreichende Ränder, besonders innen am Bund. Nach dem Upload zeigt dir der Previewer jede Seite so, wie sie gedruckt wird — nimm dir die zehn Minuten und blättere einmal komplett durch.

## Schritt 5: Cover hochladen

Fürs E-Book reicht ein Frontcover (JPG), fürs Taschenbuch brauchst du eine Gesamtdatei aus Rückseite, Buchrücken und Vorderseite — die Rückenbreite hängt von der Seitenzahl ab, KDP stellt dafür einen Rechner und Vorlagen bereit. Das Cover ist dein wichtigstes Marketinginstrument: Es muss als Daumennagel in den Suchergebnissen lesbar sein.

## Schritt 6: Preis festlegen

Bei E-Books wählst du zwischen zwei Tantiemenmodellen: **70 %** bei Preisen zwischen 2,99 € und 9,99 €, sonst **35 %**. Beim Taschenbuch bekommst du 60 % des Verkaufspreises abzüglich der Druckkosten — die hängen von der Seitenzahl ab. Ein 200-Seiten-Schwarzweiß-Taschenbuch kostet im Druck etwa 3,25 €; bei 12,99 € Verkaufspreis bleiben dir also rund 4,50 € pro Exemplar.

## Schritt 7: Veröffentlichen und prüfen lassen

Mit dem Klick auf „Veröffentlichen" geht dein Buch in die Amazon-Prüfung — in der Regel ist es innerhalb von 24 bis 72 Stunden live. Du bekommst eine E-Mail, sobald die Produktseite steht.

## Die häufigsten Anfängerfehler

- **Zu früh veröffentlichen:** Tippfehler im ersten Kapitel kosten Rezensionen, die du nie wieder loswirst.
- **Keywords verschenken:** „Buch", „Ratgeber" und dein eigener Name sind keine Suchbegriffe, die Käufer eintippen.
- **Cover selbst basteln ohne Blick für den Markt:** Vergleiche dein Cover mit den Top 10 deiner Kategorie — es muss dort bestehen.
- **Beschreibung als Pflichtübung behandeln:** Sie ist neben dem Cover der wichtigste Kauffaktor.

## Der Weg dorthin muss nicht Wochen dauern

Der KDP-Upload selbst ist in einer Stunde erledigt — die eigentliche Arbeit steckt in Manuskript, Cover und Listing. Genau diesen Teil nimmt dir **Buchwerk** ab: Es recherchiert dein Thema im Web, schreibt das komplette Manuskript, gestaltet Cover-Entwürfe und liefert Titel, Klappentext, Keywords, Kategorien und Preisempfehlung fertig zum Einfügen — inklusive Schritt-für-Schritt-Anleitung für genau den Upload-Prozess aus diesem Artikel.`,
  },
  {
    slug: "klappentext-schreiben",
    title: "Klappentext schreiben: Aufbau, Formel und Beispiel",
    description:
      "Der Klappentext verkauft dein Buch. So baust du ihn auf: die bewährte 5-Teile-Formel, ein komplettes Beispiel und die Fehler, die dich Käufer kosten.",
    published: "2026-08-05",
    content: `Der Klappentext ist der am meisten unterschätzte Text deines Buchs. Cover und Titel bringen den Interessenten zur Buchseite — aber ob er kauft, entscheidet der Klappentext. Die gute Nachricht: Er folgt einer erlernbaren Struktur.

## Was der Klappentext leisten muss

Ein Klappentext ist kein Inhaltsverzeichnis und keine Zusammenfassung. Er ist Werbetext mit einer einzigen Aufgabe: Der richtige Leser soll nach zehn Sekunden denken „das ist für mich". Dafür muss er drei Fragen beantworten:

- **Für wen ist das Buch?** Der Leser muss sich sofort wiedererkennen.
- **Welches Problem löst es?** Menschen kaufen Sachbücher wegen eines Problems, nicht wegen eines Themas.
- **Was ist danach anders?** Das konkrete Versprechen — vorsichtig formuliert, aber spürbar.

## Die 5-Teile-Formel

### 1. Der Einstieg (1–2 Sätze)

Beginne mit dem Problem oder einer überraschenden Wahrheit — nie mit „Dieses Buch handelt von …". Der erste Satz entscheidet, ob der zweite gelesen wird.

### 2. Das Problem vertiefen (2–3 Sätze)

Zeig, dass du die Situation des Lesers kennst — konkret, nicht abstrakt. Wer sich verstanden fühlt, liest weiter.

### 3. Das Versprechen (1–2 Sätze)

Was kann der Leser nach der Lektüre, was er vorher nicht konnte? Bleib ehrlich: Übertreibungen rächen sich in den Rezensionen.

### 4. Der Inhalt in Auszügen (3–5 Spiegelstriche)

Jetzt — und erst jetzt — darfst du konkret werden: die stärksten Themen des Buchs als kurze, neugierig machende Punkte. Nicht alle Kapitel aufzählen, sondern die, die kaufen lassen.

### 5. Der Abschluss (1 Satz)

Ein Satz, der die Entscheidung leicht macht: für wen sich das Buch lohnt oder was der erste Schritt ist.

## Ein Beispiel (Ratgeber)

Für einen Ratgeber über stressfreies Homeoffice könnte das so aussehen:

**Einstieg:** „Zuhause arbeiten klingt nach Freiheit — und fühlt sich nach drei Monaten oft nach dem Gegenteil an."

**Problem:** „Der Laptop bleibt abends offen, die Grenze zwischen Küche und Konferenzraum verschwimmt, und richtig konzentriert war der Vormittag auch nicht."

**Versprechen:** „Dieses Buch zeigt dir, wie du Struktur, Fokus und Feierabend zurückgewinnst — ohne starre Regeln, die im echten Alltag zerbrechen."

**Inhalt:** Drei bis fünf Punkte zu Arbeitsplatz, Tagesstruktur, Fokusphasen, Pausen und Grenzenziehen.

**Abschluss:** „Für alle, die im Homeoffice nicht nur arbeiten, sondern gut arbeiten wollen."

## Klappentext und Amazon-Beschreibung sind nicht dasselbe

Ein häufiger Fehler beim Self-Publishing: denselben Text auf die Buchrückseite und in die Amazon-Beschreibung zu kopieren. Die Rückseite wird von jemandem gelesen, der das Buch schon in der Hand hält — die Amazon-Beschreibung von jemandem, der zwischen zwanzig Suchergebnissen entscheidet. Die Beschreibung darf länger sein, mit Absätzen und Zwischenüberschriften arbeiten und relevante Suchbegriffe natürlich einbauen. Schreib beide Texte getrennt.

## Die häufigsten Fehler

- **Mit dem Autor beginnen** statt mit dem Leser („In diesem Buch teile ich meine Erfahrungen …")
- **Alles verraten:** Der Klappentext soll Appetit machen, nicht sättigen
- **Superlative stapeln:** „Das ultimative Standardwerk" überzeugt niemanden — Konkretes schon
- **Zu lang:** 100 bis 200 Wörter reichen; jeder Satz muss sich seinen Platz verdienen

## Der schnellere Weg

Wenn du dein Manuskript mit **Buchwerk** erstellst, bekommst du zum fertigen Buch auch das komplette KDP-Listing: Klappentext nach genau dieser Struktur, dazu Titel, Untertitel, Keywords, Kategorien und eine Preisempfehlung — als Vorschlag, den du nach deinem Geschmack schärfst.`,
  },
  {
    slug: "was-kostet-buch-veroeffentlichen",
    title: "Was kostet es, ein Buch zu veröffentlichen? Alle Zahlen",
    description:
      "Buch veröffentlichen: Kosten im Überblick — Self-Publishing bei Amazon KDP, Lektorat, Cover, ISBN und Druck. Mit ehrlicher Beispielrechnung und Sparpotenzial.",
    published: "2026-08-05",
    content: `Die kurze Antwort: Ein Buch bei Amazon zu veröffentlichen kostet **0 €** Grundgebühr. Die ehrliche Antwort: Zwischen 0 € und mehreren tausend Euro — je nachdem, wie viel Arbeit du auslagerst. Hier sind die echten Zahlen.

## Die Grundkosten: 0 €

Amazon KDP verlangt weder Einrichtungsgebühr noch laufende Kosten. Hochladen, veröffentlichen und weltweit verkaufen ist kostenlos; Amazon verdient über seinen Anteil am Verkaufspreis. Auch eine ISBN bekommst du für E-Book und Taschenbuch von Amazon gratis (sie gilt dann nur bei Amazon — für den Buchhandel bräuchtest du eine eigene, in Deutschland ab etwa 30 €).

Das heißt: Die Kosten entstehen nicht beim Veröffentlichen, sondern **beim Erstellen** des Buchs.

## Die klassischen Kostenblöcke

### Lektorat und Korrektorat: 500 bis 3.000 €

Der größte Posten im klassischen Self-Publishing. Ein reines Korrektorat (Rechtschreibung, Grammatik) kostet je nach Umfang 300 bis 800 €, ein echtes Lektorat (Stil, Struktur, Inhalt) schnell 1.000 bis 3.000 € für ein normales Sachbuch.

### Cover: 50 bis 800 €

Vorgefertigte Premade-Cover gibt es ab etwa 50 bis 150 €, individuelle Gestaltung vom Designer kostet 300 bis 800 €. Selbst basteln ist gratis — sieht aber meistens genau so aus, und das Cover ist dein wichtigstes Verkaufsargument.

### Formatierung und Buchsatz: 0 bis 500 €

E-Book-Formatierung und Taschenbuch-Satz kannst du mit Werkzeugen selbst erledigen; professioneller Buchsatz kostet 200 bis 500 €.

### Druckkosten: pro verkauftem Exemplar

Bei KDP zahlst du nie für einen Lagerbestand — gedruckt wird erst, wenn jemand bestellt (Print on Demand). Die Druckkosten werden vom Verkaufspreis abgezogen: Ein Schwarzweiß-Taschenbuch mit 200 Seiten kostet etwa 3,25 € pro Exemplar. Bei 12,99 € Verkaufspreis bleiben dir nach Amazons Anteil rund 4,50 € pro verkauftem Buch.

### Marketing: 0 € aufwärts

Optional, aber real: Amazon-Anzeigen, Social Media, eine Autorenwebsite. Fürs erste Buch geht es auch ohne — mit guten Keywords, den richtigen Kategorien und einem Listing, das konvertiert.

## Beispielrechnung: das klassische Self-Publishing-Buch

Für ein 200-Seiten-Sachbuch mit ausgelagertem Lektorat, gekauftem Cover und eigenem Satz landest du realistisch bei **1.200 bis 2.500 €**, bevor das erste Exemplar verkauft ist. Genau an dieser Summe scheitern viele Buchprojekte — nicht am Schreiben.

## Vorsicht: Zuschussverlage

Wenn ein „Verlag" Geld **von dir** will (oft 2.000 bis 10.000 € für „Druckkostenzuschuss" und „Verlagsleistungen"), bist du bei einem Zuschussverlag gelandet. Seriöse Verlage zahlen dich, nicht umgekehrt — und alles, was ein Zuschussverlag liefert, bekommst du im Self-Publishing günstiger und mit voller Kontrolle.

## Der KI-gestützte Weg: unter 20 €

Mit KI-Werkzeugen verschiebt sich die Rechnung grundlegend, weil die teuren Posten — Manuskripterstellung, Cover-Entwurf, Listing-Texte — nicht mehr eingekauft werden müssen. Bei **Buchwerk** kostet ein komplettes Buchprojekt einmalig 19,99 €: recherchiertes Manuskript als druckfertiges PDF, Cover und das vollständige KDP-Listing. Thema und Gliederung sind kostenlos, du zahlst erst, wenn du produzierst. Dazu kommt nur noch deine Zeit fürs Mitlesen und Überarbeiten — die solltest du jedem Buch gönnen, egal wie es entsteht.

## Fazit

Veröffentlichen ist gratis, Erstellen kostet — Geld oder Zeit. Die klassische Route liegt bei 1.200 € aufwärts, die KI-gestützte unter 20 €. Entscheidend für den Erfolg ist am Ende keine der beiden Zahlen, sondern ob dein Buch ein echtes Problem einer echten Zielgruppe löst.`,
  },
  {
    slug: "sachbuch-gliederung-erstellen",
    title: "Sachbuch-Gliederung erstellen: Vom Thema zum Kapitelplan",
    description:
      "Eine gute Gliederung entscheidet über dein Sachbuch. Die Leserfragen-Methode, drei bewährte Strukturen und die richtige Kapitelzahl — mit konkretem Vorgehen.",
    published: "2026-08-05",
    content: `Die meisten Sachbuchprojekte scheitern nicht am Schreiben — sie scheitern davor, an einer Gliederung, die nie richtig stand. Wer mit einem wackligen Kapitelplan losschreibt, merkt auf Seite 60, dass Kapitel 3 eigentlich zwei Kapitel sind und Kapitel 7 niemand braucht. Hier ist ein Vorgehen, mit dem die Struktur trägt, bevor du den ersten Satz schreibst.

## Warum die Gliederung wichtiger ist als der erste Satz

Eine Gliederung ist keine Formalie, sondern die Architektur deines Buchs. Sie entscheidet, ob Leser einen roten Faden spüren oder eine Aufsatzsammlung bekommen. Und sie ist der billigste Ort für Korrekturen: Ein Kapitel in der Gliederung zu streichen kostet zehn Sekunden — ein geschriebenes Kapitel zu streichen tut weh und passiert deshalb selten, auch wenn es nötig wäre.

## Die Leserfragen-Methode

Der zuverlässigste Weg zu einer tragfähigen Gliederung: Denk nicht in Themen, sondern in Fragen deiner Zielgruppe.

- Schreib 20 bis 30 Fragen auf, die deine Leser zu deinem Thema wirklich stellen — so, wie sie sie googeln oder einem Freund stellen würden.
- Gruppiere verwandte Fragen zu Blöcken. Jeder Block ist ein Kapitelkandidat.
- Sortiere die Blöcke in die Reihenfolge, in der ein Einsteiger sie braucht.
- Streiche alles, was zwar interessant ist, aber keine echte Leserfrage beantwortet.

Der Vorteil: Jedes Kapitel hat automatisch eine Aufgabe. Ein Kapitel, das keine Frage beantwortet, fliegt auf — in der Gliederung, nicht auf Seite 60.

## Drei bewährte Grundstrukturen

### Problem → Lösung

Der Klassiker für Ratgeber: Erst das Problem verstehen (Warum passiert das? Was steckt dahinter?), dann die Lösung in umsetzbaren Schritten. Funktioniert immer dann, wenn Leser mit einem konkreten Schmerz zum Buch kommen.

### Der Lernpfad

Vom Einfachen zum Fortgeschrittenen, jedes Kapitel baut auf dem vorherigen auf. Die richtige Wahl für Anleitungs- und Einsteigerbücher — vom ersten Handgriff bis zur Meisterschaft.

### Die Themenlandkarte

Gleichberechtigte Aspekte eines Themas, die sich unabhängig lesen lassen — etwa ein Buch über eine Hunderasse mit Kapiteln zu Herkunft, Ernährung, Erziehung, Gesundheit. Wichtig: Auch hier braucht die Reihenfolge eine Logik, meist von „was jeder wissen muss" zu „was Spezialfälle betrifft".

## Wie viele Kapitel — und wie lang?

Für ein typisches Sachbuch oder einen Ratgeber haben sich **8 bis 12 Kapitel** bewährt. Weniger wirkt dünn, mehr zersplittert das Thema. Pro Kapitel sind 1.500 bis 3.000 Wörter ein guter Rahmen — genug für Substanz, kurz genug, um in einer Sitzung gelesen zu werden. Das ergibt ein Buch von 15.000 bis 30.000 Wörtern, im Taschenbuch etwa 100 bis 200 Seiten.

## Kapitelbeschreibungen: der unterschätzte Zwischenschritt

Bevor du schreibst (oder schreiben lässt), gib jedem Kapitel zwei bis drei Sätze: Welche Frage beantwortet es, was ist die Kernaussage, womit endet es? Diese Beschreibungen sind dein Kompass beim Schreiben — und wenn du mit KI arbeitest, sind sie der Unterschied zwischen einem Kapitel, das sitzt, und einem, das am Thema vorbeischreibt.

## Der Praxistest für deine Gliederung

Bevor du loslegst, drei Prüffragen:

- **Der Fremdtest:** Würde jemand, der nur das Inhaltsverzeichnis liest, den Nutzen des Buchs verstehen?
- **Der Streichtest:** Welches Kapitel könnte weg, ohne dass etwas fehlt? Wenn du eins findest — streich es.
- **Der Reihenfolgetest:** Braucht Kapitel 5 Wissen, das erst in Kapitel 8 kommt? Dann umsortieren.

## Gliederung erstellen lassen — und selbst entscheiden

Wenn du schneller zu einem Startpunkt kommen willst: Bei **Buchwerk** gibst du dein Thema ein und bekommst kostenlos einen Titelvorschlag und eine vollständige Kapitel-Gliederung mit Beschreibungen — nach genau den Prinzipien aus diesem Artikel. Die prüfst und verschiebst du dann so lange, bis sie deinem Buch entspricht; erst danach wird geschrieben.`,
  },
];

export function getArtikel(slug: string): Artikel | undefined {
  return ARTIKEL.find((a) => a.slug === slug);
}
