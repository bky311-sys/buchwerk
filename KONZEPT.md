# Buchwerk.info — Konzeptdokument

**Version:** 1.1 (MVP-Planung)
**Stand:** 18. April 2026
**Autor:** Benjamin Koch
**Status:** Arbeitsdokument für Prototyp-Entwicklung mit Claude Code

**Änderungen gegenüber v1.0:**
- Domain von `buchwerk.ai` auf `buchwerk.info` umgestellt
- Bildgenerierung auf Flux via Replicate festgelegt (DALL·E wird 12.05.2026 eingestellt)
- Preismodell auf einen Einstiegspreis 19,99 € reduziert (weitere Stufen später)
- Neuer Abschnitt 5: Widerrufsrecht bei digitalen Inhalten (§ 356 Abs. 5 BGB) — MVP-Blocker für alles, was mit Geld zu tun hat

---

## 1. Vision & Positioning

### Das Problem

Self-Publishing im deutschsprachigen Raum ist fragmentiert. Wer ein Buch veröffentlichen will, muss sich durch ein Dickicht aus Einzeltools kämpfen:

- ChatGPT oder Claude fürs Schreiben
- Canva oder Photoshop fürs Cover
- Word/Scrivener fürs Layout
- Publisher Rocket für Keywords (englisch, teuer)
- KDP direkt für den Upload (unübersichtlich)
- Canva/CapCut für Social Media Posts
- Metricool oder Later fürs Scheduling
- Amazon Ads für Werbung

Jedes Tool will monatliche Gebühren, keins ist für den deutschen Markt optimiert, und niemand zeigt dem Autor den roten Faden vom Thema bis zum verkauften Buch.

### Die Lösung

**Buchwerk.info ist die erste deutschsprachige End-to-End-Plattform für KI-gestütztes Self-Publishing** — von der Themenvalidierung bis zum marketingfertigen KDP-Listing. Eine Plattform, ein Workflow, ein Preis.

### USPs (Unique Selling Propositions)

1. **German-first** — alle KI-Prompts, Textbausteine und Marketingvorlagen sind für den deutschen Markt optimiert, nicht aus dem Englischen übersetzt
2. **Marketing-first** — nicht nur Buchproduktion, sondern bis zum KDP-Listing mit Keywords, Kategorien und Launch-Assets
3. **Bezahlbar** — ein Preis pro Buch oder günstiges Abo, keine Umsatzbeteiligung
4. **Keine Revenue-Share-Falle** — das Buch gehört dem Autor, 100% der KDP-Einnahmen bleiben bei ihm
5. **Community-Review-System** (Ausbaustufe) — Nutzer bewerten sich gegenseitig mit Algorithmus gegen Fake-Bewertungen

### Zielgruppe (für MVP)

**Primär:** Absolute Anfänger und Hobby-Autoren mit 1–3 bereits veröffentlichten Büchern
**Sekundär:** Coaches/Experten, die ein Buch als Leadmagnet brauchen

**Nicht Zielgruppe (zumindest nicht initial):**
- Professionelle Vollzeit-Autoren (haben etablierte Workflows)
- Belletristik-Autoren (brauchen anderen Workflow als Sachbuch)
- Verlage

**Typischer Nutzer:**
- 35–60 Jahre
- Hat Expertise oder eine Geschichte, die er/sie verpacken will
- Technisch nicht versiert — will kein SaaS-Tool zusammenklicken
- Bereit, einmalig 100–300€ zu investieren, aber scheut Abo-Fallen
- Ziel: erstes oder zweites Buch veröffentlichen, ohne Verlag

---

## 2. Scope-Abgrenzung

### MVP (Version 1.0)

**Produktion + KDP-Vorbereitung**

Der Nutzer kommt mit einer Idee und geht mit:
- fertigem Manuskript (druckfertige PDF + EPUB)
- generiertem Cover (3D-Mockup für Marketing inklusive)
- KDP-Listing-Texten (Titel, Untertitel, Beschreibung, 7 Keywords, Kategorien)
- Preisempfehlung basierend auf Wettbewerbsanalyse

**Nicht im MVP:**
- Marketing-Automation (Social Posts, Ads, Email)
- Community-Review-System
- Direktupload zu KDP (geht technisch nicht, KDP hat keine API)
- VLB-Eintrag
- Hörbuch-Generierung

### Version 2.0 — Marketing-Paket

- Pressemitteilung
- Instagram/TikTok/Facebook Posts mit Autornennung
- Reels aus Cover + KI-Voiceover (ElevenLabs)
- Email-Launch-Sequenz (Brevo-Integration)
- Amazon-Ads-Kampagnen-Setup (Keywords + Targeting)
- Landing Page / Autorenseite

### Version 3.0 — Vision

- Community-Review-System mit Durchschnittswerts-Algorithmus
- Hörbuch-Pipeline
- VLB-Integration für ISBNs
- White-Label für Coaches/Agenturen
- Eigene Distribution (über KDP hinaus)

---

## 3. User Journey (MVP)

### Phase 0 — Onboarding

1. Landing Page → Registrierung (Email/Google)
2. Kurzer Onboarding-Flow: "Was willst du schreiben?" (Sachbuch / Ratgeber / Biografie / Lehrbuch)
3. Erstes Projekt wird angelegt

### Phase 1 — Themenfindung & Validierung

**User-Input:**
- Thema in 1–2 Sätzen
- Optional: Zielgruppe, eigene Expertise

**Buchwerk liefert:**
- Nischenanalyse (KDSpy-Alternative via Scraping + KI-Bewertung)
- Wettbewerbsübersicht (Top 10 Bücher zum Thema)
- Marktpotenzial-Einschätzung
- 3–5 Positionierungsvorschläge mit USP
- Entscheidungshilfe: "Diese Nische lohnt sich / lohnt sich nicht"

**User-Aktion:** Positionierung wählen

### Phase 2 — Gliederung

**Buchwerk liefert:**
- 3 Gliederungsvorschläge (unterschiedliche Strukturen: chronologisch, problem-lösung, thematisch)
- Pro Kapitel: Kernbotschaft + Stichpunkte

**User-Aktion:** Gliederung wählen, bearbeiten, freigeben

### Phase 3 — Manuskript

**Buchwerk liefert:**
- Kapitelweise Textgenerierung mit Claude API
- Autorenstil wird über Fragebogen oder Textprobe kalibriert
- Nachbearbeitungs-Modi: Kürzen / Vertiefen / Beispiele hinzufügen / Umformulieren
- Konsistenz-Check über Kapitel hinweg (Begriffe, Ton)

**User-Aktion:** Pro Kapitel freigeben oder überarbeiten lassen

### Phase 4 — Lektorat & Korrektorat

**Buchwerk liefert:**
- KI-Korrekturlesen (Grammatik, Rechtschreibung, Stil)
- Duden-konforme Anpassung (optional: Schweizer Orthografie)
- Leseprobe-Check: Wie liest sich das Buch für die Zielgruppe?
- Optional: Menschliches Lektorat als Upsell (Partnerfirma)

### Phase 5 — Cover

**Buchwerk liefert:**
- 4 Cover-Vorschläge basierend auf Genre, Titel, Zielgruppe
- Text- und Farbbearbeitung im Browser
- Automatisches Layout für eBook und Softcover (verschiedene Formate)
- 3D-Mockup-Generierung für Marketing

### Phase 6 — Layout & Export

**Buchwerk liefert:**
- Druckfertige PDF (Softcover, 5.5×8.5" oder andere Formate)
- EPUB3 (geräteoptimiert)
- MOBI (optional)
- Preview-Funktion im Browser

### Phase 7 — KDP-Vorbereitung

**Buchwerk liefert:**
- SEO-optimierter Titel + Untertitel
- Verkaufsbeschreibung (HTML-ready für KDP)
- 7 Backend-Keywords (je 50 Zeichen)
- 10 Kategorienvorschläge (KDP erlaubt bis zu 10 über Support)
- Preisempfehlung (eBook + Print)
- Autoren-Bio

**User-Aktion:** Alles kopieren, selbst bei KDP einpflegen (Medienbruch bleibt, weil KDP keine API hat)

### Phase 8 — Abschluss

- Download-Paket (alle Dateien)
- "Mein Buch"-Dashboard mit Checkliste: Was noch zu tun?
- Optional: Upsell auf Marketing-Paket (Version 2.0)

---

## 4. Preismodell — Analyse

### Optionen im Vergleich

#### Option A: Pay per Book

- **Preis:** 149€–299€ pro Buch (Einmalzahlung)
- **Pro:** Klare Wertwahrnehmung, kein Abo-Stress, hohe Conversion bei Anfängern
- **Contra:** Harte Kaufentscheidung, Umsatz schwankt stark

#### Option B: Abo-Modell

- **Preis:** 29€–49€/Monat oder 299€/Jahr
- **Pro:** Planbare MRR, Vielschreiber werden belohnt
- **Contra:** Viele Nutzer schreiben 1 Buch und kündigen, Churn hoch

#### Option C: Freemium

- **Pro:** Niedrige Einstiegshürde
- **Contra (entscheidend):** Du hast recht — es gibt keinen sinnvollen Cut. Sobald der Nutzer die PDF laden kann, ist er fertig und braucht dich nicht mehr. Alles davor (Gliederung, Manuskript, Cover) ist bereits wertvoll, aber ohne Export nutzlos — und der Export ist das Ende.

#### Option D: Hybrid — "Credits" oder "Pay per Stage"

- **Preis:** Niedriger Grundpreis (z.B. 49€) für Themenanalyse + Gliederung, dann Upgrade (z.B. 199€) für Manuskript + Export
- **Pro:** Niedrige Einstiegshürde, Nutzer committen sich in Etappen, Preispsychologie nutzt Sunk-Cost-Effekt
- **Contra:** Komplexer zu kommunizieren

### Entscheidung für MVP (18.04.2026)

**Pay per Book, ein einziger Einstiegspreis: 19,99 € pro Buch.**

| Paket | Preis | Enthält |
|---|---|---|
| **Basic** (nur diese Stufe im MVP) | 19,99 € | Alle Features: Themenanalyse, Gliederung, Manuskript, Lektorat, Cover, KDP-Listing, alle Exportformate (PDF/EPUB) |

**Warum ein einzelner, sehr niedriger Einstiegspreis:**

- **Reibungsfreier Start:** Bei 19,99 € ist der Kauf kein Commitment, sondern ein Spontanversuch. Das maximiert die Anzahl realer Nutzungen in der frühen Phase, die wir für Feedback und Produktreife brauchen.
- **Keine Preisdiskussion im UX:** Eine Stufe = keine Vergleichstabelle, kein Upsell-Overlay, kein "welches Paket passt zu mir". Der Flow bleibt auf das Produkt konzentriert.
- **Datenbasis vor Preisoptimierung:** Wir entscheiden über weitere Stufen oder Abo *nachdem* wir sehen, wie Nutzer wirklich arbeiten — wie viele Bücher pro Nutzer, wie oft neue Projekte, welche Features tatsächlich genutzt werden. Ohne diese Daten ist jedes Pricing-Tier geraten.
- **Margen bewusst in Kauf genommen:** Bei Claude-API-Kosten von 2–5 € pro Buch bleibt bei 19,99 € brutto (minus Stripe-Gebühr ca. 0,60 €) eine dünne, aber positive Marge. Das reicht für die Lernphase, nicht für Skalierung. Das ist okay — Skalierung kommt mit Stufen/Abo.

**Bewusst verschoben, nicht verworfen:**

- Monats-Abo für Vielschreiber
- Gestaffelte Pakete (z. B. mit Premium-Cover, Marketing-Add-on)
- Ratenzahlung — bei 19,99 € nicht sinnvoll

**Zu beobachten nach Launch:**

- Conversion Rate auf der Landing Page
- Wie viele Käufer generieren tatsächlich ein vollständiges Buch (Completion Rate)
- Wie viele kommen für ein zweites Buch zurück
- Tatsächliche API-Kosten pro fertigem Buch (Budget-Limit im Code ist Pflicht)

Sobald wir 3–6 Monate reale Daten haben, entscheiden wir über die nächste Preisstruktur.

---

## 5. Widerrufsrecht bei digitalen Inhalten — MVP-Blocker

**Status:** Harter Blocker für alles, was mit Geld zu tun hat. Landing Page mit Warteliste ist nicht betroffen. Sobald der Checkout in Reichweite kommt, muss dieser Abschnitt vollständig umgesetzt sein, bevor Stripe live geht.

### Rechtslage

Nach **§ 356 Abs. 5 BGB** steht einem Verbraucher bei digitalen Produkten grundsätzlich ein 14-tägiges Widerrufsrecht zu. Das Widerrufsrecht **erlischt** bei digitalen Inhalten nur dann, wenn alle drei folgenden Bedingungen **vor** Ausführung erfüllt sind:

1. Der Nutzer stimmt **ausdrücklich** zu, dass die Ausführung des Vertrages (= Start der Buchgenerierung, Freischalten von KI-Funktionen) **sofort beginnt**.
2. Der Nutzer bestätigt **zur Kenntnis genommen zu haben, dass er durch diese Zustimmung sein Widerrufsrecht verliert**.
3. Der Nutzer erhält eine **Vertragsbestätigung auf einem dauerhaften Datenträger** (in der Praxis: Email mit Vertragsinhalt, Widerrufsbelehrung und Bestätigung des Widerrufsverlusts).

Fehlt auch nur eine dieser Bedingungen, bleibt das 14-tägige Widerrufsrecht bestehen — und der Nutzer kann nach Generierung des Buches widerrufen und den vollen Kaufpreis zurückverlangen. Das wäre für uns ruinös, weil die Claude-API-Kosten bereits angefallen sind.

### Konsequenzen für den Checkout-Flow

**Zwei separate, nicht vorausgefüllte Checkboxen** direkt vor dem Zahlungsschritt. Stripe darf **erst dann** die Zahlung verarbeiten, wenn beide Checkboxen vom Nutzer aktiv angeklickt wurden.

**Checkbox 1 (Zustimmung zur sofortigen Ausführung):**

> Ich stimme ausdrücklich zu, dass Buchwerk mit der Ausführung meines Auftrags (Generierung meines Buchprojekts) **sofort nach Zahlung** beginnt.

**Checkbox 2 (Bestätigung des Widerrufsverlusts):**

> Mir ist bekannt, dass ich **mein Widerrufsrecht verliere**, sobald Buchwerk mit der Ausführung begonnen hat.

Beide Checkboxen:

- müssen **einzeln** angeklickt werden (keine einzige "Ich stimme allem zu"-Box)
- dürfen **nicht vorausgefüllt** sein
- dürfen **nicht im Footer oder in AGB versteckt** sein
- müssen **im Checkout-Flow direkt vor dem Stripe-Button** erscheinen
- der Text ist 1:1 vom AGB-Generator zu übernehmen (siehe unten)

### Technische Umsetzung

- Auf der Checkout-Seite: zwei Boolean-State-Variablen, Stripe-Button ist `disabled`, solange nicht beide `true` sind
- Beim Erzeugen der Stripe Checkout Session: Zeitstempel und IP-Adresse der Zustimmungen in der Datenbank protokollieren (`consent_timestamp`, `consent_ip`, `consent_version` — verknüpft mit der Order-ID)
- Nach erfolgreicher Zahlung (Stripe Webhook): **automatischer Versand einer Vertragsbestätigungs-Email** mit:
  - Vertragsinhalt (was gekauft wurde, Preis)
  - Widerrufsbelehrung (Volltext vom AGB-Generator)
  - Ausdrücklicher Hinweis: "Du hast dem sofortigen Beginn der Ausführung zugestimmt und bestätigt, dass dein Widerrufsrecht dadurch erlischt. Hier ist der Volltext deiner Erklärung: ..."
  - PDF-Rechnung als Anhang
- Die Email gilt als dauerhafter Datenträger. Der Versand darf nicht fehlschlagen — Retry-Mechanismus und Logging sind Pflicht.

### AGB und Widerrufsbelehrung

- Volltexte werden **nicht selbst geschrieben**.
- Vor Launch wird ein AGB-Generator beauftragt (Trusted Shops, Händlerbund oder IT-Recht Kanzlei).
- Im Code und auf der Website: **Platzhalter** `[AGB-TEXT]`, `[WIDERRUFSBELEHRUNG]`, `[DATENSCHUTZERKLAERUNG]` verwenden, bis die finalen Texte vorliegen.

### Testpflicht vor Go-Live

Checkout-Flow mit Testzahlung durchspielen und prüfen:

1. Button bleibt grau, solange eine Checkbox nicht aktiviert ist
2. Zustimmungen werden in der DB mit Zeitstempel gespeichert
3. Vertragsbestätigungs-Email kommt an, enthält alle Pflichtinhalte
4. Rechnung als PDF-Anhang funktioniert

Ohne bestandenen Test: kein Live-Schalten des Zahlungsflows.

---

## 6. Technische Architektur

### Stack

**Frontend:**
- Next.js 15 (App Router)
- React + TypeScript
- Tailwind CSS + shadcn/ui
- Rendering: überwiegend SSR, interaktive Bereiche als Client Components

**Backend:**
- Next.js API Routes (Serverless Functions auf Vercel)
- Für lange KI-Aufgaben: Vercel Queue oder Inngest (Background Jobs)

**Datenbank & Auth:**
- Supabase (Postgres + Auth + Storage + Realtime)
- Frankfurt-Region (DSGVO-konform, kennst du schon von MPU-App)

**Bezahlung:**
- Stripe (Checkout + Webhooks)
- Optional für Deutschland: Mollie (SEPA-Lastschrift besser)

**KI-Dienste:**
- Anthropic Claude API (Manuskript, Gliederung, Lektorat)
- **Flux via Replicate API** (Cover-Generierung)
  - Flux Schnell (~0,003 $/Bild) für erste Entwürfe und Iterationen
  - Flux Pro 1.1 (~0,04 $/Bild) für finale Cover
  - Begründung: DALL·E 3 wird von OpenAI am **12.05.2026** eingestellt. Flux hat zusätzlich das beste Textrendering unter den aktuellen Bildmodellen, was für Buchtitel auf dem Cover entscheidend ist.
- ElevenLabs (später für Hörbuch, Voice-ID `pqHfZKP75CvOlQylNhV4`)

**Dateigenerierung:**
- Typst (PDF-Rendering, du kennst es aus dem buch-workflow)
- Pandoc (EPUB-Konvertierung)
- Läuft entweder auf einer separaten Render-VM oder in Docker-Lambdas

**Hosting:**
- Frontend + API: Vercel
- Datenbank: Supabase
- Schwere Render-Jobs: eigener kleiner Server (z.B. Hetzner Cloud, 10€/Monat)

**Monitoring:**
- Sentry (Fehler)
- Plausible oder Umami (Analytics, DSGVO-konform)

### Datenmodell (Grundgerüst)

```
User
  ├── id, email, created_at
  ├── stripe_customer_id
  └── purchases[]

Book
  ├── id, user_id, title, status
  ├── genre, target_audience
  ├── manuscript (jsonb — Kapitel als Array)
  ├── cover_url
  ├── kdp_listing (jsonb)
  ├── created_at, updated_at
  └── exports[]

Chapter
  ├── id, book_id, order, title
  ├── content (text)
  ├── status (draft, reviewed, final)
  └── revision_history[]

Export
  ├── id, book_id, format (pdf, epub, mobi)
  ├── file_url, created_at
  └── version
```

### KI-Pipeline — Kritische Punkte

1. **Kapitel-Generierung muss streambar sein** — sonst wartet der Nutzer 60 Sekunden auf Antwort
2. **Kostenkontrolle** — jeder Nutzer hat ein Budget-Limit (Claude-API-Kosten pro Buch ca. 2–5€)
3. **Prompt-Versionierung** — Prompts werden zentral verwaltet, nicht im Code verteilt
4. **Fallback-Strategien** — wenn Claude API down ist, wird an OpenAI gefailt

---

## 7. Roadmap

### Phase 1 — Konzept & Planung (jetzt)

- [x] Konzeptdokument (dieses hier, v1.1)
- [x] Domain registriert: `buchwerk.info` bei All-inkl
- [x] Email eingerichtet: `welcome@buchwerk.info`
- [x] Entscheidung: Preismodell final (19,99 € Einstieg, eine Stufe)
- [x] Entscheidung: Bildgenerierung final (Flux via Replicate)
- [ ] Wireframes für User Journey
- [ ] Logo + Branding grob (auch noch nicht final)
- [ ] Farbpalette entschieden
- [ ] AGB-Generator beauftragt (vor Checkout-Live-Schaltung)

### Phase 2 — MVP-Entwicklung (8–12 Wochen)

- [ ] Next.js-Setup mit Supabase-Anbindung
- [ ] Auth + Dashboard
- [ ] User Journey Phase 1–2 (Themenanalyse + Gliederung)
- [ ] User Journey Phase 3 (Manuskript mit Claude API)
- [ ] User Journey Phase 5 (Cover-Generator)
- [ ] User Journey Phase 6 (PDF/EPUB-Export via Typst)
- [ ] User Journey Phase 7 (KDP-Listing)
- [ ] Stripe-Integration
- [ ] DSGVO-Basics (AGB, Datenschutz, Impressum)

### Phase 3 — Closed Beta (4 Wochen)

- [ ] 10–20 Beta-Tester (aus eigenem Netzwerk + aufdenpunkt-Community)
- [ ] Feedback einarbeiten
- [ ] Preispunkte testen

### Phase 4 — Public Launch

- [ ] Landing Page finalisieren
- [ ] Launch-Marketing (Presseaussendung, Social Media, eigene Buchautoren als Testimonials)
- [ ] Support-Workflow aufsetzen (anfangs: Ben selbst beantwortet alles)

### Phase 5 — Marketing-Paket (V2)

- [ ] Nach 3–6 Monaten live, wenn MVP läuft

---

## 8. Offene Fragen / Risiken

1. **KDP-API fehlt:** Der letzte Schritt (Upload zu KDP) muss manuell bleiben. Das ist ein UX-Bruch. Lösung: Sehr guter "Copy-Paste-Assistent" mit Screenshots, wohin was gehört.

2. **Rechtslage bei KI-generierten Inhalten:** Urheberrecht bei KI-Texten in Deutschland noch ungeklärt. Buchwerk sollte in AGB klarstellen, dass der Nutzer verantwortlich ist und das Manuskript noch bearbeiten sollte.

3. **Qualität der generierten Bücher:** Es wird Mist-Bücher geben, die Nutzer veröffentlichen. Das schadet der Marke, wenn es zu sichtbar wird. Gegenmaßnahme: Qualitäts-Check vor Export, Warnhinweis bei zu niedriger Qualität.

4. **Skalierung der KI-Kosten:** Bei 100 Büchern/Monat gehen die API-Kosten auf 300–500€. Margen-Rechnung notwendig.

5. **Wettbewerb:** Sudowrite (englisch), Novelcrafter, Draft2Digital, Atticus — aber keiner davon bietet End-to-End für den deutschen Markt. Das ist der Vorsprung, solange er hält.

---

## 9. Nächste konkrete Schritte

1. **Domain:** ✅ `buchwerk.info` bei All-inkl registriert, Email `welcome@buchwerk.info` eingerichtet
2. **Preismodell:** ✅ entschieden (19,99 € Einstieg, eine Stufe)
3. **Bildgenerierung:** ✅ entschieden (Flux via Replicate)
4. **Farbpalette:** Benjamin wählt aus 2–3 Vorschlägen
5. **Next.js-Setup:** Projekt initialisieren (pnpm), Supabase-Projekt `buchwerk-prod` anbinden
6. **Prototyp-Ziel für Woche 1:** nur Landing Page mit Warteliste — kein Login, kein Dashboard, kein Stripe, keine KI. Impressum + Datenschutz mit Platzhaltern.
7. **Ab Woche 2:** schrittweise Auth, Dashboard, KI-Pipelines. Stripe-Checkout kommt erst, wenn der Widerrufsrecht-Flow (Abschnitt 5) vollständig umgesetzt und getestet ist.

---

*Ende Konzeptdokument v1.1*
