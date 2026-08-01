# Go-Live-Checkliste — buchwerk.info

Stand: 2026-07-12. Basiert auf einem vollständigen Review (Security/RLS, Recht/DSGVO,
Payment, Workflow/Export, Config/Deploy). **A** = im Code erledigt/erledigbar,
**B** = nur Benjamin (Secrets, Konsolen, Rechtstexte, Infra).

## ✅ Verifikation 2026-07-31 (komplett durchgeprüft, live gegen Prod)

Alle ehemaligen 🔴-Blocker bis auf den Schalter selbst sind erledigt und wurden
am 31.07. **live verifiziert** (API-Calls gegen Anthropic/Stripe/Resend,
Spalten-Checks gegen die Prod-DB, Crawl aller öffentlichen Seiten):

- Migrationen: alle eingespielt (Signatur-Spalten aller Migrationen vorhanden).
- Production-Env: alle Pflicht-Variablen gesetzt (`vercel env ls`).
- Modell `claude-sonnet-4-6`: am Konto gültig (Models-API). `ANTHROPIC_MODEL` ungesetzt = Default, ok.
- Web-Search-Tool: freigeschaltet (Test-Call mit Tool akzeptiert).
- Stripe: **Live**-Keys (rk_live/pk_live), Webhook `buchwerk.info/api/stripe/webhook`
  enabled mit checkout.session.completed, customer.subscription.updated/deleted
  (+ invoice.payment_failed), Preise 19,99 € einmalig / 29,99 €/Monat, beide aktiv+live.
- Resend: Domain buchwerk.info **verified**, sending enabled (eu-west-1).
- RLS-Härtung: anon-Inserts/-Selects auf reading_progress, point_ledger,
  subscriptions, shop_reviews blockiert (42501/leer).
- Alle öffentlichen Seiten 200 (Landing, Shop, 2 Buchseiten, 4 Rechtsseiten,
  Widerrufsformular, Auth-Seiten, robots.txt, sitemap.xml); Gate rewritet ohne
  Cookie korrekt auf „Bald verfügbar"; OG-Meta vollständig.
- Bonus seit 12.07.: EPUB-Export existiert (`manuskript/epub/route.ts`).

**Verbleibt vor dem Schalter** (Reihenfolge empfohlen):
1. (B) Rechtstexte-Endabnahme + AVVs + ggf. USt-IdNr (unverändert offen — einziger echter B-Punkt).
2. Autor-Moderation einmal im UI durchspielen (Freigeben + Ablehnen mit Begründung);
   die Test-Bewertung wartet als pending auf der Veröffentlichen-Seite des Hochzeitscheckers.
3. Testdaten räumen: Test-Review + point_ledger-Eintrag + geseedeter
   reading_progress des Testaccounts (Service-Role, ein Script).
4. `SITE_LIVE=true` + Redeploy.

Nicht blockierend, bewusst offen: SENTRY_AUTH_TOKEN (nur Source-Maps), Analytics,
Vercel-Timeouts (Code deckelt selbst auf 60 s; Vercel erlaubt heute 300 s Default —
bei Timeout-Beschwerden `maxDuration` hochsetzen), ungedeckelte KI-Endpunkte
(Cover/Gliederung/Recherche/Listing — Kostenrisiko beobachten), Produktentscheidung
§5.2/§5.3 (Testleser-Kreis vs. öffentliche Bewertungen).

## 🔴 Blocker

- [x] **(A) Paywall-/Shop-/Review-Bypass geschlossen** — Migration `20260712130000_security_hardening.sql` + Umstellung `lib/billing/access.ts` und `lib/shop/actions.ts` auf Service-Role für sensible Writes. → Migration muss noch eingespielt werden (siehe unten).
- [x] **(A) Manuskript-Export als PDF** — `app/(app)/projekte/[id]/manuskript/pdf/route.ts` (Titelei + alle Kapitel, paginiert) + Download-Button auf der Projektseite (nur wenn Buch fertig). EPUB folgt später über einen Render-Worker (Pandoc, nicht serverless).
- [x] **(A) Testmodus-Hinweis** im Checkout nur noch außerhalb von Production sichtbar.
- [x] **(A) Modell-ID env-konfigurierbar** (`ANTHROPIC_MODEL`, Default `claude-sonnet-4-6`).
- [x] **(B) Modell-ID gegen das Anthropic-Konto verifizieren** ✅ 31.07. — falls `claude-sonnet-4-6` dort ungültig ist, `ANTHROPIC_MODEL` setzen. Sonst schlagen ALLE KI-Calls fehl.
- [x] **(B) Migrationen einspielen** ✅ 31.07. verifiziert (Supabase-Dashboard SQL-Editor oder CLI), in Reihenfolge:
  `20260711120000_projects_add_shop`, `20260711130000_buchshop_reviews`,
  `20260711140000_projects_add_boost`, `20260712120000_projects_add_research`,
  `20260712130000_security_hardening`.
- [x] **(B) Vercel Production-Env** setzen ✅ 31.07. verifiziert: `ANTHROPIC_API_KEY`, `REPLICATE_API_TOKEN`,
  `RESEND_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_BOOK`,
  `STRIPE_PRICE_SUB`, Supabase-3, `NEXT_PUBLIC_SENTRY_DSN`, `SITE_BYPASS_TOKEN`.
  (vollständige Liste + Kommentare jetzt in `.env.example`)
- [x] **(B) Web-Search-Tool** ✅ 31.07. verifiziert im Anthropic-Konto freischalten (für die Recherche-Phase).
- [x] **(B) Stripe live** ✅ 31.07. verifiziert: Live-Keys, Webhook-Endpoint `https://buchwerk.info/api/stripe/webhook`
  mit Events `checkout.session.completed`, `customer.subscription.updated`,
  `customer.subscription.deleted`; Price-IDs = 19,99 € (Buch) / 29,99 €/Mon. (Abo).
- [x] **(B) Resend-Domain** ✅ 31.07. verifiziert `buchwerk.info` verifizieren (sonst bouncen DOI-/Kaufbestätigungsmails).
- [ ] **(B) Gate öffnen**: `SITE_LIVE=true` in Production (Redeploy).

## 🟡 Wichtig

- [x] **(A) Rechtslinks überall erreichbar** — gemeinsame `LegalFooter` in `(app)`/`(auth)`-Layouts;
  Buchshop-Footer um AGB/Widerruf ergänzt.
- [x] **(A) `robots.ts` + `sitemap.ts`** angelegt (greifen nach Go-Live).
- [x] **(A) `.env.example`** vollständig (11 fehlende Variablen ergänzt, mit Pflicht-Markierung).
- [x] **(A) First-Pass-Checkpoint** vor dem Vertiefen-Durchgang (kein Datenverlust/Doppelkosten bei Timeout).
- [x] **(A) Research-Suchen auf 4 gesenkt** + `claudeJson` gegen Code-Fences robust.
- [ ] **(B) Rechtstexte-Endabnahme** (Impressum/Datenschutz/AGB/Widerruf sind gut, aber selbst verfasst;
  Haftung liegt bei dir) + USt-IdNr (falls vorhanden) + AVVs mit allen Auftragsverarbeitern real abschließen.
- [ ] **(B) Vercel Pro erwägen** — Hobby cappt Functions auf 60 s; lange KI-Calls (Recherche,
  Vertiefen-Pass) können anstoßen. Pro erlaubt 300 s. Code ist auf 60 s gedeckelt; gekillte Läufe
  zeigen „erneut versuchen".
- [ ] **(B) `SENTRY_AUTH_TOKEN`** in der Build-Env (sonst keine Source-Maps in Sentry).

## 🟢 Nice-to-have (offen, A)

- [x] **(A) `metadataBase` + OpenGraph/Twitter** im Root-Layout.
- [ ] Analytics (Plausible/Umami, DSGVO-konform) — laut KONZEPT geplant, noch nicht eingebaut (braucht Konto/Domain).
- [ ] Recherche vor dem Kapitel-Schreiben **erzwingen** statt nur empfehlen (Produktentscheidung).
- [ ] Globaler Wortzahl-Top-up (aktuell nur pro Kapitel geprüft; Gesamt <7000 wird rot angezeigt, aber nicht erzwungen).
- [ ] Kleinere Härtung: expliziter `getUser()`-Guard in den KI-Routen (Defense-in-Depth; RLS deckt es aktuell), Cron-Query-Secret entfernen.
- [ ] Manuskript-**EPUB** (Render-Worker/Pandoc) + „Alle Dateien herunterladen"-Paket.
- [ ] KDP-Listing auf Trigger+Poll umstellen (aktuell blockierende Action, ~20 s).
