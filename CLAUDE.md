# CLAUDE.md — Buchwerk.info

**Dieses Dokument liest du zuerst, bevor du irgendetwas am Code machst.**

Es beschreibt, was Buchwerk ist, wie wir arbeiten und welche Konventionen gelten. Bei Unklarheiten fragst du nach, statt zu raten.

---

## Projekt in einem Satz

Buchwerk.info ist eine deutschsprachige KI-gestützte Self-Publishing-Plattform, die Autoren vom Thema bis zum KDP-fertigen Buch führt — Manuskript, Cover, KDP-Listing, alles in einem Workflow.

Das vollständige Produktkonzept steht in `KONZEPT.md` (bitte lesen, bevor du Features implementierst).

---

## Arbeitsweise mit Benjamin

Benjamin ist der Gründer und einzige Entwickler. Er hat Erfahrung mit Swift/iOS, Python und WordPress-Setups, aber Next.js und moderne Web-Stacks sind für ihn neu. Er arbeitet parallel an mehreren Projekten (aufdenpunkt, benjaminkoch.org, Prosoz).

### Kommunikation

- Du sprichst Benjamin mit "du" an, nicht "Sie"
- Kein Sugarcoating — wenn eine Idee nicht gut ist, sagst du es direkt und begründest es
- Benjamin nutzt oft Voice-Dictation → rechne mit Transkriptionsfehlern, rate nicht wild, sondern frage kurz nach
- Technische Entscheidungen mit kurzer Begründung kommunizieren, nicht einfach umsetzen

### Workflow-Regeln

- **Keine großen Refactorings ohne Rückfrage** — wenn du mehr als 3 Dateien gleichzeitig umbauen willst, kurz anmelden
- **Änderungen am Tech-Stack** werden grundsätzlich vorher besprochen
- **Iterativ arbeiten** — kleine lauffähige Schritte, nicht stundenlang am großen Wurf bauen
- **Commits machen** nach jedem sinnvollen Teilschritt, klare Commit-Messages auf Deutsch

---

## Tech-Stack (festgelegt)

### Frontend & Backend
- **Next.js 16** mit App Router (nicht Pages Router)
- **TypeScript** durchgängig (kein plain JS)
- **React Server Components** als Default, Client Components nur wenn nötig
- **Tailwind CSS 4** für Styling
- **shadcn/ui** für Komponenten — nicht selbst neu bauen, was es dort gibt

### Datenbank & Auth
- **Supabase** (Frankfurt-Region, DSGVO)
- Projekt-Name: `buchwerk-prod` (später auch `buchwerk-dev`)
- Auth via Email/Passwort + Google OAuth
- Row Level Security (RLS) auf allen Tabellen — ohne Ausnahme

### Bezahlung
- **Stripe** für Karten/PayPal
- **Mollie** als deutsche Alternative für SEPA-Lastschrift (später, nicht im MVP)

### KI-Dienste
- **Anthropic Claude API** (claude-sonnet-4-5 für Manuskript und Lektorat)
- **Flux via Replicate API** für Cover-Bildgenerierung
  - Flux Schnell (~0,003 $/Bild) für Entwürfe
  - Flux Pro 1.1 (~0,04 $/Bild) für finale Cover
  - Grund: DALL·E 3 wird am 12.05.2026 eingestellt, Flux hat das beste Textrendering für Buchtitel
- **ElevenLabs** (erst ab V2 für Hörbuch, voice_id `pqHfZKP75CvOlQylNhV4`)

### Dateigenerierung
- **Typst** für PDF (Benjamin hat bereits einen funktionierenden Workflow unter `~/Documents/buch-workflow/`, orientiere dich daran)
- **Pandoc** für EPUB
- Rendering läuft via separaten Worker-Prozess, nicht in Serverless Functions (Timeout-Problem)

### Hosting & Deployment
- **Vercel** für Next.js-App (kostenlos für Start)
- **Supabase Cloud** für DB/Storage
- **Hetzner Cloud** (kleine VM, ~10€/Monat) für Render-Worker mit Typst/Pandoc
- **Domain:** `buchwerk.info` über All-inkl, DNS auf Vercel zeigen lassen

### Monitoring
- **Sentry** für Fehler
- **Plausible** oder **Umami** für Analytics (DSGVO-konform, kein Google Analytics)

---

## Code-Konventionen

### Sprache im Code

- **UI-Texte:** Deutsch (Du-Form, freundlich, aber professionell — nicht anbiedernd)
- **Code-Kommentare:** Englisch (Industriestandard, bleibt lesbar für eventuelle spätere Mitentwickler)
- **Variablen- und Funktionsnamen:** Englisch
- **Commit-Messages:** Deutsch (Benjamin liest sie selbst)

### Dateistruktur

```
buchwerk/
├── app/                    # Next.js App Router
│   ├── (marketing)/       # Landing, Pricing, About — öffentlich
│   ├── (auth)/            # Login, Register, Passwort-Reset
│   ├── (app)/             # Eingeloggter Bereich: Dashboard, Projekte
│   └── api/               # API Routes für Webhooks etc.
├── components/
│   ├── ui/                # shadcn-Komponenten (nicht manuell editieren)
│   └── buchwerk/          # Eigene Komponenten
├── lib/
│   ├── supabase/          # Supabase-Client (server, client, admin)
│   ├── ai/                # Claude API, Prompts, Pipelines
│   ├── stripe/            # Stripe-Logik
│   └── utils.ts
├── prompts/               # Zentrale Prompt-Verwaltung (NICHT im Code verstreut)
│   ├── gliederung.md
│   ├── kapitel.md
│   └── kdp-listing.md
├── types/                 # TypeScript-Typen, DB-Schema-Typen via Supabase CLI
├── KONZEPT.md             # Produktkonzept
└── CLAUDE.md              # Dieses Dokument
```

### Prompt-Management

Alle KI-Prompts liegen als Markdown-Dateien in `/prompts`. Sie werden im Code geladen, nicht hart reingeschrieben. So kann Benjamin Prompts anpassen, ohne Code zu ändern, und wir können später A/B-Tests auf Prompts machen.

```ts
// ✅ Richtig
import { loadPrompt } from "@/lib/ai/prompts";
const prompt = await loadPrompt("gliederung", { thema, zielgruppe });

// ❌ Falsch
const prompt = `Erstelle eine Gliederung für ${thema}...`;
```

### TypeScript-Regeln

- Keine `any`-Types. Wenn nötig, `unknown` und dann typsicher prüfen
- Supabase-Typen werden via CLI generiert: `npx supabase gen types typescript`
- Zod-Schemas für alle externen Eingaben (API Routes, Forms)

### Styling-Regeln

- Keine Inline-Styles, alles über Tailwind
- Farben und Spacing über Tailwind-Defaults oder `tailwind.config.ts`
- Dark Mode vorbereiten, aber nicht im MVP aktivieren

---

## Aktueller Stand (wird fortlaufend aktualisiert)

**Stand: 18. April 2026**

- [x] Konzept finalisiert (siehe KONZEPT.md)
- [x] Domain registriert: `buchwerk.info` bei All-inkl
- [x] Email eingerichtet: `welcome@buchwerk.info`
- [ ] GitHub-Repo angelegt
- [ ] Vercel-Projekt verbunden
- [ ] Supabase-Projekt angelegt (Frankfurt)
- [ ] Stripe-Account vorbereitet (noch nicht benötigt für Landing Page)
- [ ] Next.js-Projekt initialisiert
- [ ] Landing Page deployed

### Nächster Meilenstein (Woche 1)

Eine einfache Landing Page auf `buchwerk.info`:
- Hero-Bereich mit Claim und CTA
- 3 Sektionen: Problem, Lösung, Features-Teaser
- Email-Erfassung für Warteliste (Speicherung in Supabase)
- Footer mit Impressum-Link (Impressum muss korrekt sein — DSGVO-Pflicht!)
- Responsive (Mobile first)
- Ladezeit < 1s

**Bewusst nicht dabei:** Login, Dashboard, Stripe, KI-Features. Das kommt ab Woche 2.

---

## Rechtliches — Pflichtseiten

Bevor irgendwas live geht, brauchen wir:

- **Impressum** (mit Benjamins vollständigen Daten, anbieterkennzeichnung nach §5 TMG)
- **Datenschutzerklärung** (ausführlich, weil Supabase, Stripe, Claude API genutzt werden)
- **AGB** (Nutzungsbedingungen, Haftungsausschluss bei KI-generierten Inhalten — wichtig!)
- **Cookie-Banner** (nur wenn Cookies außer essentielle gesetzt werden)

**Wichtig bei den AGB:** Haftungsausschluss, dass der Nutzer für veröffentlichte Inhalte selbst verantwortlich ist, und dass Buchwerk keine Garantie für Urheberrechts-Freiheit KI-generierter Texte übernimmt.

---

## Wichtige "Don'ts"

- **Keine Browser-Storage-APIs** (localStorage, sessionStorage) in Serverless-Umgebungen
- **Keine Google Analytics / Google Fonts** (DSGVO-Problem, stattdessen Plausible + self-hosted Fonts)
- **Keine Hardcoded-Secrets** im Code — alles via `.env.local` und Vercel Environment Variables
- **Kein WordPress, kein PHP, keine Plugin-Hölle**
- **Keine CSS-Frameworks außer Tailwind** (Bootstrap, Bulma etc. nicht einmischen)
- **Kein Over-Engineering** — kein Kubernetes, kein Microservice-Gedöns. Wir sind zwei Leute (Benjamin + du), nicht Google

---

## Entscheidungsprotokoll

Hier werden zentrale Architektur- und Produktentscheidungen dokumentiert, damit wir später nachvollziehen können, warum etwas so ist wie es ist.

### 2026-04-18: Next.js statt WordPress
**Grund:** Buchwerk ist eine Web-App mit User-Accounts, KI-Pipelines und Projekten. WordPress ist ein CMS und würde ein Plugin-Chaos erzwingen.

### 2026-04-18: buchwerk.info statt buchwerk.ai
**Grund:** `.info` kostenlos bei All-inkl, keine geographische Einschränkung, konsistent mit `aufdenpunkt.info`. Upgrade auf `.ai` oder `.com` später möglich, falls Produkt läuft.

### 2026-04-18: Supabase statt eigene Postgres
**Grund:** Integrierte Auth, File Storage, Realtime. Frankfurt-Region DSGVO-konform. Benjamin kennt Supabase bereits aus der MPU-App.

### 2026-04-18: Pay per Book als Preismodell, eine Stufe bei 19,99 €
**Grund:** Freemium scheitert am fehlenden natürlichen Nutzen-Gate. Abo überfordert Anfänger. Gestaffelte Pakete (149/249/399 €, ursprüngliche Idee in v1.0) verworfen, weil wir noch keine realen Nutzungsdaten haben, um Tiers sinnvoll zu ziehen. Stattdessen niedriger Einstiegspreis 19,99 € — maximiert Anzahl realer Käufe in der Lernphase. Weitere Stufen und Abo werden entschieden, wenn wir 3–6 Monate Daten haben. Details in KONZEPT.md Abschnitt 4.

### 2026-04-18: Cover-Bildgenerierung mit Flux via Replicate (nicht DALL·E)
**Grund:** DALL·E 3 wird von OpenAI am 12.05.2026 eingestellt. Flux hat zusätzlich das beste Textrendering für Buchtitel. Flux Schnell für Entwürfe, Flux Pro 1.1 für finale Cover.

### 2026-04-18: Checkout-Flow mit zwei Pflicht-Checkboxen für Widerrufsrecht
**Grund:** Nach § 356 Abs. 5 BGB erlischt das 14-tägige Widerrufsrecht bei digitalen Inhalten nur, wenn der Nutzer vor Ausführung ausdrücklich zustimmt, dass sofort begonnen wird, und bestätigt, dass er sein Widerrufsrecht verliert — plus Vertragsbestätigung auf dauerhaftem Datenträger (Email). Ohne korrekte Umsetzung kann der Nutzer nach Buchgenerierung widerrufen und sein Geld zurück verlangen, während wir die Claude-API-Kosten bereits getragen haben. Harter MVP-Blocker für Stripe-Integration. Details in KONZEPT.md Abschnitt 5.

### 2026-04-18: AGB, Widerrufsbelehrung, Datenschutz von AGB-Generator
**Grund:** Rechtstexte werden nicht selbst geschrieben. Vor Launch wird Trusted Shops, Händlerbund oder IT-Recht Kanzlei beauftragt. Im Code werden bis dahin Platzhalter `[AGB-TEXT]`, `[WIDERRUFSBELEHRUNG]`, `[DATENSCHUTZERKLAERUNG]` verwendet.

### 2026-04-18: Farbpalette „Werkstatt 3b" mit Flaschengrün #2E6B3D
**Grund:** Palette 3 (Erdtöne: Sand-Hintergrund #F5F1EB, dunkles Braun-Schwarz als Text, warmes Taupe als Sekundärtext, Terracotta als Fehlerfarbe) gewählt, weil sie Buchwerk vom typischen Silicon-Valley-SaaS-Look abhebt und zum Markenkern „Werkstatt/Verlag/Handwerk" passt. Akzent von ursprünglichem Olivgrün #3F5D3A auf Flaschengrün #2E6B3D geändert: stärkerer Verlagsbezug (Penguin/Faber-Assoziation), klarerer CTA ohne den ruhigen Gesamtcharakter zu stören. Single Source of Truth: `docs/DESIGN.md`.

### 2026-04-18: Inter als einzige Schrift, self-hosted via `@fontsource-variable/inter`
**Grund:** Google Fonts per CDN ist DSGVO-kritisch (IP-Übertragung an Google). `@fontsource-variable/inter` liefert die Schrift als npm-Package, die Dateien werden vom eigenen Server ausgeliefert — kein externer Request. Variable Font erspart separate Dateien pro Weight. Nur Weights 400 (Body) und 500 (Medium für Headlines/Buttons) werden verwendet.

### 2026-04-18: Next.js 16 statt 15
**Grund:** `create-next-app@latest` hat bei Initialisierung am 18.04.2026 Next.js 16.2.4 installiert. Kein inhaltlicher Grund, auf 15 zu downgraden — App Router, Tailwind 4, TypeScript-Setup identisch, Breaking Changes gegenüber 15 für unsere Anwendungsfälle minimal. Dokumentation in CLAUDE.md entsprechend angepasst.

---

## Bei Zweifeln

Wenn du als Claude Code unsicher bist:

1. Schau in dieses Dokument
2. Schau in `KONZEPT.md`
3. Frage Benjamin — lieber eine kurze Rückfrage als zwei Stunden in die falsche Richtung coden

Benjamin arbeitet meistens früh morgens ab 7 Uhr. Wenn er im Chat antwortet, ist er also wach und fokussiert — nutze das, um wichtige Entscheidungen kurz abzuklopfen, statt alleine zu raten.

---

*Ende CLAUDE.md*
