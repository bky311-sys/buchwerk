# LESEN-UND-BEWERTEN.md — Entscheidungsvorlage

**Status: Vorschlag, nicht entschieden.** Grundlage: Recherche vom 15.07.2026 zu
Rezenzo, Pubby, ARC-Distributoren, deutschem Markt, Rechtslage (UWG/DSA) und
Verhaltensforschung zu Bewertungssystemen.

Ergänzt `BUCHSHOP.md` (= Ist-Zustand). Bei Widerspruch gilt bis zur Entscheidung
BUCHSHOP.md.

---

## 0. Vorab: Drei Korrekturen am aktuellen Stand

**1. Das Punktesystem ist bereits gebaut.** Nicht geplant — gebaut und
verdrahtet: `shop_reviews`, `point_ledger`, `shop_acquisitions`, 20 Punkte pro
freigegebener Bewertung, 30 Punkte → 7 Tage Boost, 2h-Lesesperre,
Autor-Moderation. `BUCHSHOP.md:7` („Phase 2/3 offen") ist veraltet; Zeile 111
sagt für Phase 3 selbst „✅ gebaut".

**2. `BUCHSHOP.md` beschreibt Rezenzo falsch.** Dort steht, Rezenzos Punkte seien
„ein rein internes Plattforminstrument" und „genau diese Nicht-Monetarisierung
hält das Modell Amazon-ToS- und UWG-konform". Beides ist nach Prüfung der
Primärquellen nicht haltbar — siehe Abschnitt 2. Die Entscheidung „Modell A" vom
11.07.2026 steht damit auf einer falschen Tatsachengrundlage.

**3. Die Sentiment-Neutralität ist nur nominell.** Siehe Abschnitt 3.1. Das ist
der schwerwiegendste Einzelbefund und unabhängig von jeder Strategieentscheidung
zu beheben.

---

## 1. Die strategische Kernfrage, die vor jeder Mechanik steht

**Wozu sollen die Bewertungen dienen?** Davon hängt alles ab, und die beiden
möglichen Antworten führen zu völlig verschiedenen Produkten.

### Antwort A: „Damit sich das Buch auf Amazon besser verkauft."

Das ist, was Autoren wollen. Und es ist der Weg, den Rezenzo und Pubby gehen.
**Dieser Weg ist für buchwerk versperrt** — nicht aus Vorsicht, sondern weil er
drei gleichzeitige Kollisionen erzeugt (Abschnitt 2). Wenn getauschte
Bewertungen bei Amazon landen, ist buchwerk aus Amazons Sicht ein
Manipulationsring. Konsequenz im schlimmsten Fall: KDP-Sperrung der Nutzer,
KDP-Sperrung des eigenen Kontos (aufdenpunkt/Ben Book, inkl. aller
bestehenden Titel und Tantiemen), Amazon als Klägerin.

### Antwort B: „Damit das Buch im buchwerk-Shop gefunden und gekauft wird."

Rechtlich beherrschbar — aber **heute wertlos**. Der Shop hat keinen Traffic. Eine
Bewertung auf einer Seite, die niemand besucht, verkauft kein Buch. Der Autor
merkt das nach dem zweiten Boost und hört auf.

### Die ehrliche Konsequenz

**Das, was Autoren wollen, ist verboten. Das, was erlaubt ist, wollen Autoren
(noch) nicht.** Ein Token-System kann diese Lücke nicht schließen — es kann nur
Aktivität erzeugen, die niemandem nützt. Punkte sind ein Abrechnungsmedium, kein
Wertversprechen.

**Deshalb schlägt dieses Dokument vor, die Frage zu wechseln:** nicht „wie
bekommen wir Bewertungen?", sondern „was ist das Einzige, das buchwerk seinen
Autoren geben kann, das Amazon, Rezenzo und Pubby nicht geben können?"

Die Antwort steht in der Datenbank: **buchwerk besitzt den Text.** Kein anderer
Anbieter in diesem Markt hat das. Rezenzo und Pubby verschicken PDFs und hoffen.
buchwerk kann das Buch ausliefern, im Browser anzeigen und messen, ob gelesen
wurde. Daraus folgen zwei Produkte, die beide etwas taugen — und beide brauchen
zuerst dieselbe fehlende Hälfte: **einen Reader.**

---

## 2. Warum der Amazon-Pfad ausscheidet (drei unabhängige Gründe)

### 2.1 Amazon-Regeln

Community-Richtlinien und KDP-Hilfe (Topic G202101910), sinngemäß:

- Kostenloses/vergünstigtes Exemplar anbieten ist **erlaubt** — „im Gegenzug aber
  weder eine Rezension **verlangen** noch versuchen, die Rezension zu
  **beeinflussen**".
- Alles **andere** als ein Gratis-/Rabatt-Exemplar (ausdrücklich inkl.
  Gutscheine, Bonus-Inhalte, Gewinnspiel-Teilnahme) → „die Rezension wird
  ungültig und … entfernt".
- **Gegenseitige Rezensionen sind untersagt** — auch ohne Geldfluss.
- Rezensionen über Produkte von **Wettbewerbern** sind untersagt. In einem
  Autoren-bewerten-Autoren-Pool sind alle Teilnehmer KDP-Wettbewerber.

Sanktion: Löschung, im Wiederholungsfall Sperrung von Käufer- **und** KDP-Konto.
Amazon braucht dafür keinen Richter und keine Anhörung.

### 2.2 UWG

- **Anhang zu § 3 Abs. 3 Nr. 23c** (Per-se-Verbot, seit 28.05.2022):
  „die Übermittlung oder **Beauftragung** gefälschter Bewertungen …". Der Wortlaut
  ist auf den **Vermittler** zugeschnitten, nicht auf den Händler.
- **§ 5a Abs. 4 S. 2/3 UWG**: Kommerzieller Zweck liegt vor, sobald „Entgelt oder
  eine **ähnliche Gegenleistung**" fließt — **und die Gegenleistung wird
  vermutet**, der Handelnde muss das Gegenteil glaubhaft machen. Punkte sind eine
  ähnliche Gegenleistung. Die Gegenseitigkeit selbst ist auch ohne Punkte eine.
- **Präzedenz: LG Hamburg, 12.03.2021 – 315 O 464/19.** Beklagter war der
  **Vermittler**, der Tester und Händler zusammenbrachte — nicht der Händler,
  nicht der Rezensent. Klägerin war Amazon. Das ist strukturell exakt die
  Position, die buchwerk einnehmen würde.

### 2.3 Der Ausnahmetatbestand des BGH-Amazon-Urteils

**BGH, 20.02.2020 – I ZR 193/18** wird gern als Entlastung zitiert („Händler
haftet nicht für Kundenbewertungen"). Der Leitsatz gilt aber nur für **nicht
veranlasste** Bewertungen. Die Ausnahme:

> „Gibt der Anbieter … selbst irreführende oder gefälschte Kundenbewertungen ab,
> **bezahlt er dafür** oder können ihm die Kundenbewertungen aus anderen Gründen
> als Werbung zugerechnet werden, **haftet er als Täter, gegebenenfalls
> Mittäter**, eines Wettbewerbsverstoßes."

Ein Token-System veranlasst und bezahlt. Damit: **Täterhaftung**, kein
Hosting-Privileg, keine Störerhaftungs-Abwägung.

### 2.4 Was Rezenzo tatsächlich macht (Primärquellen, 15.07.2026)

Wichtig, weil `BUCHSHOP.md` Rezenzo als Beleg für Konformität anführt:

- Rezenzo **behauptet** auf Homepage und Preisseite: „Rezenzo ist keine
  Rezensionstausch-Plattform. Es gibt keine **direkte 1:1**-Gegenleistung."
  Das Wort, das die Aussage trägt, ist „direkte".
- Das HilfeCenter beschreibt: „**Nachdem dein eigenes Buch genehmigt wurde**,
  werden dir Bücher anderer Autoren angezeigt, die du rezensieren kannst."
  → Zugang zum Rezensieren setzt ein eigenes Buch voraus. **Die Leser sind
  Autoren.** Das ist ein Tausch über einen Punkte-Pool.
- **Punkte sind mit Geld kaufbar** (Digistore24, „Extra-Punkte", verfallen nicht).
- **„Externe-Veröffentlichung" kostet 45 Punkte** — fällig genau dann, wenn die
  Rezension auf Amazon gehen soll.
  → **Die Kette Geld → Punkte → Amazon-Rezension ist geschlossen.** Das ist
  ökonomisch eine bezahlte Amazon-Rezension.
- Punkte werden **sofort bei Annahme** gutgeschrieben, nicht nach Abgabe.
- **Kein technischer Lesenachweis.** Kein Timer, kein Quiz, keine
  Fortschrittsmessung. Härteste Schranke: 300 Zeichen Mindestlänge.
- Die Homepage wirbt mit **„100% Richtlinien-Konform"**; die eigenen
  Nutzungsbedingungen kalkulieren Löschungen und **Kontosperren** bereits ein und
  streiten jede Gewähr ab. Kein Wort zu Nr. 23b/23c, kein Gutachten.
- **Firmensitz: Rezenzo, LLC, Newark, Delaware.** Deutsche Rechtswahl, aber
  Durchsetzung gegen eine Delaware LLC.
- Die deutsche Zielgruppe diskutiert Rezenzo in der Facebook-Gruppe
  **„rezitausch"** — u. a. im Thread „Ist REZENZO denn wirklich bei AMAZON KDP
  akzeptiert?".

**Fazit:** Rezenzo ist kein Konformitäts-Vorbild, sondern Pubby auf Deutsch mit
einer Delaware-Haftungshülle. Der Satz in `BUCHSHOP.md`, ihre
Nicht-Monetarisierung halte das Modell konform, ist sachlich falsch: Ihre Punkte
**sind** monetarisiert.

**Was von Rezenzo trotzdem taugt:** die 300-Zeichen-Mindestlänge (Pubby hat
keine), die Trennung interne Rezension → optionale externe Veröffentlichung, und
die Kennzeichnungsformel. Nicht übernehmen: die **Korrekturanforderung**, mit der
der zahlende Autor Rezensionen zur Überarbeitung zurückschicken kann — das ist
wörtlich „die Rezension beeinflussen".

---

## 3. Was am gebauten System repariert werden muss — unabhängig von allem anderen

### 3.1 Der Autor entscheidet über die Bezahlung des Rezensenten 🔴

`lib/shop/review-actions.ts:153` (`approveReviewAction`): Punkte werden erst bei
Freigabe **durch den bewerteten Autor** gutgeschrieben. `rejectReviewAction`
zahlt nichts.

Formal hängen die 20 Punkte nicht an den Sternen (`points.ts` ist
sentiment-neutral). Praktisch entscheidet der Bewertete, ob der Bewertende
bezahlt wird. Wer 2 Sterne gibt, kann ohne Begründung abgelehnt werden. Der
Rezensent lernt das nach dem ersten Mal.

Das ist exakt die Konstellation aus **OLG Frankfurt, 09.06.2022 – 6 U 232/21**:

> Rezensionen, für die eine Gegenleistung fließt, sind nicht frei von
> sachfremden Einflüssen; es besteht die konkrete Gefahr, dass ein nicht
> unerheblicher Teil der Teilnehmer, beeinflusst durch die Belohnung, ein Produkt
> positiver bewertet, als es der tatsächlichen Meinung entspricht — **in der
> Hoffnung, weiter am Programm teilnehmen zu können.**

Das Urteil sagt zugleich: „wenn auch geringes" Entgelt genügt, und
**Inhaltsneutralität entlastet nicht**. Damit ist die tragende Begründung von
Modell A („sentiment-neutral, also unproblematisch") vom einschlägigsten Urteil
im Feld ausdrücklich verworfen.

**Zu tun:** Punktegutschrift von der Autor-Freigabe entkoppeln. Der Autor darf
melden, nicht bezahlen. Über Missbrauch entscheidet der Betreiber.

### 3.2 Die 2h-Sperre ist keine Prüfmaßnahme 🔴

`REVIEW_LOCK_MS` startet mit einem Dropdown („PDF / Kindle / Kauf",
`review-widget.tsx:24-28`). Es findet **keine Auslieferung und keine
Verifikation** statt — der Nutzer behauptet, das Buch zu haben, wartet zwei
Stunden und bewertet.

**Anhang Nr. 23b UWG** ist ein Per-se-Verbot: die Behauptung, Bewertungen
stammten von tatsächlichen Nutzern, „ohne dass **angemessene und
verhältnismäßige Maßnahmen zur Überprüfung** ergriffen wurden". Ein Timer auf eine
Selbstauskunft ist keine Überprüfung.

### 3.3 Kennzeichnung fehlt im Aggregat 🟡

`app/buchshop/[slug]/page.tsx:162-167` setzt das Badge „Punkte-Bewertung" korrekt
an die **Einzelbewertung**. Der Sterne-Durchschnitt (Zeile 100-108, `summarize()`)
trägt keinen Hinweis — obwohl belohnte Bewertungen in ihn einfließen.

Genau das war der Streitgegenstand in OLG Frankfurt 6 U 232/21: Die Kennzeichnung
muss **auch im Gesamtbewertungsergebnis** sichtbar sein.

### 3.4 § 5b Abs. 3 UWG: Hinweis fehlt vollständig 🟡

> „Macht ein Unternehmer Bewertungen zugänglich, … so gelten als wesentlich
> Informationen darüber, **ob und wie** der Unternehmer sicherstellt, dass die
> veröffentlichten Bewertungen von solchen Verbrauchern stammen, die die Waren …
> tatsächlich genutzt oder erworben haben."

Trifft die Plattform direkt, größenunabhängig, **schon beim bloßen Veröffentlichen**
(LG Stuttgart, 03.02.2026 – 34 O 63/25 KfH). Abmahnfähig auch dann, wenn jede
einzelne Bewertung echt ist.

Die Norm zwingt **nicht** zur Verifikation, sondern zur Wahrheit über die
Verifikation. „Wir prüfen nicht" wäre zulässig — aber dann darf nirgends der
gegenteilige Eindruck entstehen (sonst Nr. 23b).

### 3.5 DSA: Begründungspflicht bei Ablehnung 🟡

`rejectReviewAction` entfernt eine Bewertung ohne Begründung an den Verfasser.
**Art. 17 DSA** verlangt bei jeder Beschränkung (Entfernung, Herabstufung,
Kontosperrung) eine klare Begründung mit Tatsachen und Rechtsbehelfsbelehrung.
Größenunabhängig.

Entlastung: **Art. 20 DSA** (internes Beschwerdemanagement) entfällt für
Kleinstunternehmen über **Art. 19 Abs. 1**. Art. 11, 12, 14, 16, 17 gelten
trotzdem — das ist Handwerk (Kontaktstelle, Meldefunktion, AGB-Kapitel,
Begründungs-Template), kein Geschäftsmodellrisiko.

---

## 4. Was die Verhaltensforschung zum Token-Ansatz sagt

**Der Anreiz selbst ist das Problem, nicht seine Ausgestaltung:**

- **Deci, Koestner & Ryan (1999)**, Meta-Analyse über **128 Experimente**:
  task-kontingente Belohnung verdrängt intrinsische Motivation mit **d = −0,40**.
  Zuverlässige Übeltäter: **erwartete, materielle** Belohnungen. Ein Token pro
  Rezension ist erwartet, materiell und task-kontingent — die Volltreffer-Kombination.
- Für Rezensionen **spezifisch** dokumentiert: „Motivation crowding in online
  product reviewing: A qualitative study of Amazon reviewers".
- Was Menschen tatsächlich zum Rezensieren bringt: Altruismus (~35 % der Motive),
  Selbstdarstellung, Anerkennung für Geschmack, Zugehörigkeit, Ärger.
  **Punkte verdrängen genau diese Leute** und behalten die, die für Punkte skimmen.
- **Pubby ist der empirische Beleg**, wie das endet: Rezensionen binnen eines
  Tages für ganze Romane; Rezensenten erwähnen „eine Figur, die im ersten Kapitel
  tot war"; „NEUN VON ZEHN Rezensionen sagten dasselbe". Ein Pubby-**Befürworter**
  schätzt den Bias auf **~1 Stern nach oben**.
- **Token-Ökonomien kippen strukturell**, nicht durch Betriebsunfall: Pubby musste
  den Pro-Bonus von 20.000 auf 10.000 Snaps halbieren und **die Werbung
  einstellen**, „to prevent an influx of free trial members who earn snap bonuses
  but don't always contribute long-term". Zu viele wollen Bewertungen, zu wenige
  lesen. Das ist die **Gleichgewichtslage jedes Reziprok-Pools**, nicht ein
  Anfangsfehler.
- **Goodhart**: Jedes *übertragbare* Proof-of-Work wird zum Markt gehandelt.
  Ausnahmslos in allen untersuchten Systemen (Accelerated Reader → Quiz-Ringe,
  Medium Read-Ratio → offener Tab, Stack Overflow → Voting Rings, Scribophile →
  „verbosity pays").

**Realitätsanker für die Planung:** StoryOrigin ist die einzige Plattform, die
echte Zahlen offenlegt — Wahrscheinlichkeit einer fertigen Rezension binnen 2–4
Wochen **< 40 %**, bei ungeprüften Rezensenten **10–15 %**. Die beworbenen
75–80 % anderer Anbieter sind Marketing.

---

## 5. Vorschlag

### 5.0 Stand 15.07.2026: Reader ist gebaut ✅

Migration `20260715140000_reader.sql`.

| Baustein | Datei |
|---|---|
| Lesefreigabe (Opt-in, getrennt vom Listing) | `projects.shop_readable`, `setShopReadableAction` |
| Reader-Seiten | `app/buchshop/[slug]/lesen/[position]/page.tsx` |
| Text laden (nur `shop_published` **und** `shop_readable`, nur Kapitel „fertig") | `lib/shop/reader-queries.ts` |
| Markdown → React, ohne neue Dependency | `components/buchwerk/chapter-prose.tsx` |
| Heartbeat-Client | `components/buchwerk/reading-tracker.tsx` |
| Heartbeat-Endpunkt (einzige Schreibstelle) | `app/api/lesen/heartbeat/route.ts` |
| „Genug gelesen?" | `lib/shop/reading.ts` |

**Regeln:**
- **Lesen ≠ Listen.** `shop_published` = Schaufenster (niedrige Hürde → viele
  Bücher). `shop_readable` = Autor gibt den Volltext frei, Default **false**.
  Ohne Freigabe: keine Bewertungen. *Wer bewertet werden will, muss lesen lassen.*
- **Lesen ist Abo-Leistung.** Autor liest sein eigenes Buch gratis, sammelt dabei
  aber keinen Fortschritt (nichts zu beweisen, nichts zu bewerten).
- **Gemessen wird aktive Zeit**, nicht Wanduhr: Heartbeat nur bei sichtbarem Tab
  **und** Interaktion in den letzten 60 s. Server schreibt pro Beat höchstens
  `HEARTBEAT_SECONDS` und lehnt zu schnelle Beats ab → Request-Replay bringt nichts.
- **Kapitel gilt als gelesen** bei ≥90 % Scrolltiefe **und** ≥ Wörter/400 wpm
  Sekunden aktiv (400 wpm = hastiges Überfliegen; deutsche Prosa liegt bei
  200–250). Beides nötig: In 3 Sekunden nach unten scrollen ist kein Lesen, eine
  Stunde auf Seite 1 sitzen auch nicht.
- **Buch bewertbar** ab 80 % der Kapitel. Nicht 100 % — wer ehrlich ein Kapitel
  von acht überspringt, hat trotzdem eine Meinung, und ein 100-%-Zwang würde nur
  antrainieren, das letzte Kapitel blind durchzuscrollen.
- **`reading_progress` hat keine Write-Policy.** Die Zahlen gaten eine Belohnung;
  über den öffentlichen anon-Key dürfte man sonst genau das fälschen, was sie
  beweisen sollen. Alle Schreibzugriffe laufen über den Heartbeat mit
  service-role.
- **Reader ist `noindex`** — das Manuskript ist das Produkt des Autors, an einen
  geschlossenen Kreis gegeben, nicht ins Web gestellt.

**Ersetzt:** Die 2h-Sperre und der „PDF/Kindle/Kauf"-Erwerbsvermerk sind raus
(`markReadingAction`, `REVIEW_LOCK_MS` gelöscht). Sie banden niemanden: Wer nicht
liest, klickt und wartet, und Warten kostet nichts. Die Tabelle
**`shop_acquisitions` ist damit funktionslos** — bewusst nicht gedroppt (Migration
bleibt gültig, leere Tabelle schadet nicht), kann bei der nächsten Aufräum-Migration weg.

**Was ehrlich bleibt:** Das ist eine **Messung, kein Beweis**. Ein Skript schlägt
jedes clientseitige Signal. Der Anspruch ist, Schummeln teurer und langweiliger
zu machen als Lesen — genau so steht es auch im Transparenzblock, und mehr darf
dort nie stehen (sonst Nr. 23b). Der Text in `review-disclosure.tsx` wurde
entsprechend von „wir prüfen nicht" auf die reale Mechanik umgestellt.

**Offen:** Kein Wiedereinstiegs-Merker („zuletzt gelesen"); Fortschritt zählt nur
vorwärts, Wiederlesen bringt nichts. Beides bewusst, kann später kommen.

---

### 5.1 Warum der Reader die Voraussetzung für alles war

**Bücher im Browser lesbar machen.** Der Text liegt in `chapters.content`. Es
braucht eine Leseansicht unter `/buchshop/<slug>/lesen` und eine Tabelle für den
Lesefortschritt (Kapitel, Position, Lesezeit, Sitzungen).

Warum das der eigentliche Hebel ist:

1. **Es ist der einzige Burggraben.** Rezenzo und Pubby können das nicht — sie
   besitzen den Text nicht. buchwerk schon.
2. **Es macht Nr. 23b erfüllbar.** „Nur Leser, die im buchwerk-Reader mindestens
   X gelesen haben, dürfen bewerten" ist eine *angemessene und verhältnismäßige
   Maßnahme*. Das ist der Satz, den Rezenzo nicht schreiben kann — und damit
   zugleich die Marketing-Differenzierung.
3. **Es macht den § 5b-Abs.-3-Hinweis zu einem Verkaufsargument** statt zu einem
   Kleingedruckten.
4. **Es kostet fast nichts im Betrieb** — kein Claude-Call, kein Replicate.
   Anders als die Buchproduktion (2–5 € pro Buch) ist Lesen praktisch gratis.

**Aber:** Lesenachweis ist kein gelöstes Problem. Medium zeigt, dass Zeitschwellen
trivial fallen (ein offener Tab besteht den Test). Erwartung also: Der Reader
macht Betrug **teurer und langweiliger**, nicht unmöglich. Das reicht für Nr. 23b
und für die Qualität — mehr sollte nicht behauptet werden.

### 5.2 Dann: Reziprozität dorthin verschieben, wo sie unbedenklich ist

**Vorschlag: Testleser-Kreis statt Rezensenten-Tausch.**

Nicht „ich bewerte dein veröffentlichtes Buch, du meins", sondern: **vor der
Veröffentlichung liest jemand dein Manuskript und gibt dir Feedback.**

Warum das die bessere Antwort auf dieselbe Frage ist:

| | Shop-Bewertung (heute) | Testlesen (Vorschlag) |
|---|---|---|
| Rechtlich | Verbraucherbewertung → UWG Nr. 23b/23c, § 5b Abs. 3, § 5a Abs. 4 | **Feedback, keine öffentliche Bewertung** → keiner dieser Tatbestände |
| Amazon | Kollisionsgefahr, sobald Bezug entsteht | **Kein Berührungspunkt** |
| Wert bei 0 Traffic | ~0 (Bewertung auf unbesuchter Seite) | **Voll** — besseres Buch ist besseres Buch |
| Reziprozitätsbias | Verzerrt öffentliche Sterne | **Egal** — Feedback muss nicht unverzerrt aggregiert werden |
| Motivation | Punkte verdrängen (d = −0,40) | Autoren wollen Feedback ohnehin |
| Deutsches Präzedenz | keins außer Rezenzo | **LovelyBooks-Leserunden**, etabliert |

Dazu löst es KONZEPT.md-Risiko Nr. 3 („Es wird Mist-Bücher geben, die Nutzer
veröffentlichen. Das schadet der Marke") — und zwar an der einzigen Stelle, an
der es lösbar ist: **vor** dem Upload.

**Mechanik (Scribophile-Architektur, nicht Pubby-Architektur):**

Der entscheidende Unterschied: **Das Produkt ist die knappe Warteschlange, nicht
die Währung.** Scribophile hat 8 Spotlight-Slots pro Genre; ein Werk verlässt den
Spotlight nach 3 ausführlichen Kritiken. Das *garantiert* Feedback. Die Punkte
sind nur das Abrechnungsmedium.

- Punkte verdienen: ein fremdes Manuskript testlesen + Feedback abgeben
- Punkte ausgeben: das eigene Manuskript in die (knappe) Testlese-Warteschlange
- **Kein Kauf von Punkten mit Geld.** Das ist die harte Linie — genau hier
  scheitert Rezenzo. Sobald Geld → Punkte → Bewertung geht, ist es eine gekaufte
  Bewertung.
- Feedback-Freigabe **nicht** durch den Autor. Der Autor meldet Missbrauch, der
  Betreiber entscheidet.
- Kein Sterne-Rating im Testlese-Feedback — es ist Feedback, keine Bewertung.
  Damit entfällt der ganze Rating-Inflation-Komplex.

### 5.3 Die öffentlichen Shop-Bewertungen: behalten, aber entkoppeln

- **Punkte für Shop-Bewertungen abschaffen.** Sie kaufen Bewertungsinflation,
  verdrängen die intrinsisch Motivierten und tragen das gesamte UWG-Risiko.
  Bewertungen entstehen dann aus den Gründen, aus denen Menschen wirklich
  bewerten — langsamer, aber echt und rechtlich haltbar.
- **Bewerten nur mit verifiziertem Lesefortschritt** aus dem Reader. Das Dropdown
  „PDF/Kindle/Kauf" entfällt ersatzlos.
- **§ 5b-Abs.-3-Hinweis** sichtbar am Bewertungsblock, wahrheitsgemäß.
- Falls Punkte je an Bewertungen zurückkehren: Kennzeichnung **auch am Aggregat**
  (OLG Frankfurt).
- Der Amazon-CTA bleibt, wie er ist: freiwillig, unbezahlt, ohne Kopplung an
  Punkte. Das ist zulässig und soll so bleiben.

### 5.4 Was der Boost angeht

Boost gegen Punkte ist **intern und unbedenklich** — Sichtbarkeit im eigenen Shop
ist keine Bewertung. Er kann bleiben. Nur die *Verdienstseite* muss sich ändern
(nicht mehr: Punkte für Bewertungen; sondern: Punkte fürs Testlesen).

### 5.5 Cold Start — was die Recherche dazu sagt

- **Wattpad** startete mit gemeinfreien Klassikern, um zuerst *Leser* zu holen.
  Jahr 1: ~1.000 Nutzer, 2 $ AdSense. **Drei Jahre lang lud niemand etwas hoch.**
- **Reddits** Lektion aus den Fake-Accounts ist **Ton setzen, nicht Volumen** —
  die Normen hielten, als echte Nutzer kamen. ⚠️ Für *Bewertungen* ist diese
  Taktik nicht verfügbar: gefälschte Bewertungen sind Nr. 23c, per se.
  Für *Testlese-Feedback* wäre Seeding durch dich unbedenklich.
- **Atomares Netzwerk**: „kleiner und spezifischer, als du denkst". Für buchwerk
  vermutlich *ein Themenfeld, eine Handvoll Bücher, ~20 Leser* — nicht „deutsche
  Selfpublisher".
- Median der genutzten Wachstumshebel bei Marktplätzen: **2**. Fokus schlägt
  Streuung.

**Konsequenz:** Erwartungen niedrig halten. Das Testlese-System funktioniert
ab dem ersten Paar (2 Autoren, 1 Manuskript) — ein Bewertungs-Shop erst ab
Traffic, den es nicht gibt. Das ist ein weiteres Argument für die Reihenfolge.

---

## 6. Konkrete UX-Empfehlungen (belegt)

**Einbauen:**
- **5–7-Punkt-Skala.** Preston & Colman (2000): 2–4-Punkt-Skalen sind bei
  Reliabilität und Trennschärfe messbar schlecht; über 10 fällt die
  Test-Retest-Reliabilität. Die vorhandene 1–5-Skala ist in Ordnung.
- **Asymmetrische Reibung** (Amazon-Muster): unter 4 Sternen ein strukturierter
  Grund verpflichtend, Lob bleibt billig. Erzwingt die Artikulation des Negativen.
- **Prompt-/Beispieltext über dem Feld**, nie als Placeholder (NN/g: Placeholder
  verschwinden beim Tippen → Gedächtnislast).
- **55–66 Zeichen pro Zeile** im Reader (Dyson & Haselgrove 2001: 55 CPL höchstes
  Verständnis). Scrollen als Default; Pagination höchstens als Umschalter —
  Joshi/Casiez/Vogel (CHI EA '25, n=100): Verständnis 14,8 vs. 14,7 (p=0,93),
  kein Argument für Pagination.

**Nicht bauen:**
- **Keine Aspekt-Sub-Ratings** neben dem Gesamt-Rating. Mehr & Simmons (JCR
  2024, 10 präregistrierte Experimente): Aspekt-Ratings ließen *mittelmäßige*
  Erlebnisse **positiver** bewerten (b = 0,24–0,31, „avoiding negative
  redundancy") und **senkten die prognostische Validität** des Gesamt-Ratings
  (r = 0,67 → 0,56). Das wäre der teuerste vermeidbare Fehler.
- **Keine Mindestzeichenzahl** als Qualitätsproxy. Kein Feldexperiment stützt sie;
  ein Experiment, das Rezensionen mit **explizit nicht-informativem** Text
  auffüllte, fand die aufgeblähten Versionen wurden **signifikant höher** in der
  Qualität bewertet. Länge kauft Padding. (Rezenzos 300 Zeichen sind besser als
  nichts, aber kein Qualitätsinstrument.)
- **Kein Fortschrittsbalken oben** im Reader. Meta-Analyse über 32 Experimente:
  langsamer Früh-Fortschritt → **höhere** Abbruchrate als gar kein Balken. Ein
  Buchkapitel löst genau diese Bedingung aus. Falls überhaupt: unten.

**Reziprozität/Simultaneous Reveal:** Die Airbnb-Studie (Fradkin, Grewal & Holtz,
Marketing Science 2021, n = 119.789) ist hier **nur bedingt einschlägig** — sie
behandelt *paarweise* gegenseitige Bewertung. Der buchwerk-Pool ist bereits
poolvermittelt (jeder bewertet jeden), Vergeltung ist strukturell nicht möglich.
Simultaneous Reveal bringt hier also wenig. Festhalten lässt sich aber die
Größenordnung des Reziprozitätsproblems allgemein: im Kontrollarm gaben **74 %
der Gäste 5 Sterne**; negativer Text steckte in **31 % der 4-Sterne-** und 9,2 %
der 5-Sterne-Bewertungen. Und die J-Kurve ist nach Hu/Pavlou/Zhang ein
**Antwort-Selektions-Artefakt**: Wenn *alle* bewerten müssen, ist die Verteilung
annähernd normal. Jede zusätzliche Hürde selektiert stärker auf die Extremisten —
ein weiteres Argument gegen Mindestlängen und Pflichtfelder auf der Lob-Seite.

---

## 6a. Kostenrechnung (15.07.2026, gegen den Code gerechnet)

**Korrektur an KONZEPT.md:** Dort steht „Claude-API-Kosten von 2–5 € pro Buch"
und daraus abgeleitet „eine dünne, aber positive Marge". Beides stimmt nicht. Die
Schätzung vom April ist um **Faktor 2–5 zu pessimistisch**.

Preise: Sonnet 4.6 $3/$15 pro MTok, Web-Suche $10/1.000, Flux Pro ~$0,04/Bild
(Anthropic-Preisdoku, abgerufen 15.07.2026). Ablauf aus dem Code: Gliederung
(2.000 max_tokens) → Recherche (3 Etappen × 2 Suchen, je 2.000) → N Kapitel
(je 8.000, + optionaler Vertiefen-Durchgang à 8.000) → Listing (2.000) →
Cover-Prompts (3 × 400) + Flux.

| Szenario | Kosten/Buch |
|---|---|
| Leicht (6 Kap., keine Vertiefung, 2 Cover) | **0,66 €** |
| Realistisch (8 Kap., halbe Vertiefung, 5 Cover) | **1,05 €** |
| Schwer (10 Kap., volle Vertiefung, 15 Cover) | **1,73 €** |

**Abo (29,99 €):** 1 Buch/Monat → 28,27 € Marge. 3 Bücher → 26,18 €. 10 Bücher
im schweren Fall → **12,00 €**. Selbst am Limit bleibt die Marge zweistellig.
**Einmalkauf (19,99 €):** 17,73–18,80 € Marge.

Bruttomarge also ~90 %. **Das Abo ist das Verdienstmodell und es trägt.**

### Was daraus folgt

1. **Der Shop muss nicht verdienen, er muss binden.** Bei ~90 % Marge ist ein
   gehaltener Abonnent 27 €/Monat wert. Hält die Community jemanden einen Monat
   länger, schlägt das jede Boost-Gebühr, die man zu nehmen wagen würde.
2. **Lesen kostet nichts** — kein Claude-Call, kein Replicate. Reader und
   Testlese-Kreis sind im Betrieb praktisch gratis; die einzigen Kosten sind
   Entwicklungszeit. Die Community wird aus der Marge finanziert. Es gibt
   **keinen ökonomischen Grund**, Punkte kaufbar zu machen oder den Amazon-Pfad
   zu riskieren.
3. **Die Kostenbremse ist nicht das Nadelöhr.** Bei ~1 € pro Buch schützt
   `SUBSCRIPTION_MONTHLY_LIMIT = 10` vor ~10 € Kosten. Das Limit ist eher
   Produkt- als Kostenschutz.

### Wo real Geld ausläuft 🔴

- **Regenerieren ist unbegrenzt.** `gateProduction` verbraucht einen Slot pro
  **Buch** (`book_unlocks` hat `unique(project_id)`), nicht pro Generierung. Ist
  ein Buch freigeschaltet, sind Kapitel-Neuläufe für den Nutzer gratis und für
  uns nicht gedeckelt. 50 Neuläufe auf einem Slot ≈ **19 €**. Das Monatslimit
  greift nicht, weil es Bücher zählt, nicht Aufrufe.
- **Es gibt kein Budget-Limit.** KONZEPT.md:240 führt es als Pflicht
  („Budget-Limit im Code ist Pflicht"); `grep` über `lib/` findet nichts.

Beides blutet **heute nicht**, weil `SITE_LIVE` das Gate zuhält und außer den
Beta-Testern niemand produziert. Vor dem Live-Gang muss es zu sein.

### Stand 15.07.2026: Kapitel-Deckel gebaut

`CHAPTER_GENERATION_LIMIT = 10` in `lib/books/generate.ts`, gezählt in
`chapters.generation_count` (Migration `20260715120000`). **Bewusst still** — die
Zahl wird nicht angekündigt, sondern meldet sich nur, wenn jemand sie reißt: Eine
angekündigte Zahl liest sich als Guthaben und lädt zum Ausschöpfen ein, und
niemand, der ehrlich schreibt, kommt in die Nähe. Gezählt wird **vor** dem
Modell-Aufruf, damit ein von der Function-Zeitgrenze gekillter Lauf mitzählt
(sonst wäre Abbrechen ein Gratis-Retry).

Die Migration schließt zugleich eine Lücke, die `chapters` seit jeher hatte:
`chapters_update_own` kannte **keine** Spalten-Allowlist (anders als `projects`
seit `20260712130000`). Ohne das wäre `generation_count` per PostgREST direkt auf
0 zurücksetzbar gewesen. Alle 16 Schreibzugriffe im Code sind von der neuen
Allowlist (`position, heading, summary, content, status, sources`) gedeckt;
Insert und Delete sind eigene Privilegien und unberührt.

**Bekannte, bewusst akzeptierte Lücke:** Kapitel löschen und neu anlegen setzt den
Zähler zurück (Default 0). Das kostet den Nutzer aber seinen Kapiteltext, und
Kapitel löschen ist eine legitime Funktion. Für eine Missbrauchs-Bremse reicht
das; wasserdicht wäre nur ein Zähler außerhalb der Zeile (eigene Tabelle je
Projekt+Position) — Over-Engineering beim aktuellen Volumen.

**Noch ungedeckelt:** Cover (`cover-generate.ts`, ~$0,04/Bild — nach Kapiteln der
zweitgrößte Posten), Gliederung neu (`outline-generate.ts`), Recherche
(`research.ts`, ~0,21 €/Lauf), Listing, Kapitel-Vertiefen von Hand
(`chapter-edit-actions.ts`). Alle laufen über `gateProduction` und damit über
denselben Ein-Slot-pro-Buch. Kapitel waren der teuerste Pfad, aber nicht der
einzige.

### Modell-Wahl

- `lib/ai/anthropic.ts:13` nutzt `claude-sonnet-4-6` — **gültig und korrekt**.
  CLAUDE.md nennt veraltet `claude-sonnet-4-5`; beide kosten $3/$15, also nur ein
  Doku-Fehler.
- **Sonnet 5 nicht nehmen.** Scheinbar billiger ($2/$10 bis 31.08.2026), nutzt
  aber einen ~30 % dichteren Tokenizer und wird ab 01.09.2026 auf $3/$15
  gestellt → effektiv ~$3,90/$19,50, also **teurer** als 4.6.
- **Prompt-Caching lohnt nicht.** Das Recherche-Dossier (~6.000 Token) steckt in
  jedem Kapitel-Prompt (8 Kapitel ≈ 48.000 Input-Token). Caching drückt das auf
  ~⅓ — spart aber nur ~9 Cent/Buch. Nicht die Mühe wert.

**Unsicherheit:** Größte Annahme sind die Web-Suchergebnisse als Input-Token
(~8.000/Etappe angesetzt). Selbst bei Faktor 2,5 daneben bleibt die Recherche
unter 0,50 € und die Gesamtaussage steht. Die Kapitel-Ausgabe ist durch
`maxTokens: 8000` nach oben gedeckelt. Rechenskript: siehe Scratchpad `kosten.py`.

---

## 7. Vorgeschlagene Reihenfolge

1. **Sofort, unabhängig von der Strategie:** Punktegutschrift von der
   Autor-Freigabe entkoppeln (3.1). Das ist ein kleiner Eingriff mit dem größten
   Effekt — und der einzige Punkt, der die eigene Modell-A-Begründung
   aushebelt.
2. **Vor dem Live-Gang des Shops:** § 5b-Abs.-3-Hinweis (3.4),
   Aggregat-Kennzeichnung (3.3), Art.-17-Begründung bei Ablehnung (3.5).
   Alles klein, alles abmahnrelevant.
3. **Entscheidung Benjamin:** Testleser-Kreis (5.2) vs. Weiterbau der
   Shop-Bewertungen (5.3). Beide brauchen zuerst den Reader (5.1).
4. **Danach:** Reader bauen. Dann die gewählte Richtung.

---

## 8. Was offen/unverifiziert ist

- **Rezenzos exakte Punktkosten** pro Rezensionsanfrage — nur eingeloggt sichtbar.
  Verifiziert sind nur 45 Punkte (externe Veröffentlichung) und 525/Monat (VIP).
- **Rezenzo-Preiswiderspruch:** HilfeCenter nennt Basic „27 €/Mt., 297 €/Jahr",
  die Preisseite 243 €/Jahr regulär bzw. 121,50 € Aktion. Eine Quelle ist veraltet.
- **Keine höchstrichterliche Entscheidung** zu einer Peer-Review-Plattform mit
  Token-System. Die Instanzrechtsprechung ist durchgehend streng, aber kein Fall
  ist identisch. Es gibt kein gesichertes „so geht es".
- **Ob eine vollständig transparente, inhaltsneutrale Variante mit echter
  Lesekontrolle hält, ist nicht entschieden.** Die OLG-Frankfurt-Passage zur
  „Hoffnung, weiter am Programm teilnehmen zu können" spricht dagegen.
- **Amazons Richtlinien-Originalseiten** liefern automatisierten Abrufen 503; der
  Wortlaut stammt aus KDP-Hilfe (direkt abgerufen) und Sekundärquellen. Vor einer
  Entscheidung eingeloggt manuell prüfen.
- **LovelyBooks:** ob die Gratis-Ausnahme für „Independently Published" 2026 noch
  gilt (0 € vs. 790 € Mindestabnahme) — praktisch wichtigster offener Punkt, falls
  dieser Kanal je genutzt werden soll.
- Kein Beleg, dass **irgendwer** im Markt Lesefortschritt zum Review-Gating nutzt.
  Das ist Chance und Warnung zugleich.

**Rechtsberatung ersetzt dieses Dokument nicht.** Für ein System mit Anreiz auf
Bewertungen ist anwaltliche Prüfung vor Launch nicht optional — konsistent mit der
Entscheidung vom 18.04.2026, Rechtstexte nicht selbst zu schreiben.
