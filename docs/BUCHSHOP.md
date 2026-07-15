# BUCHSHOP.md — Buchwerk.info

**Modul „Buchshop"** — bei Buchwerk entstandene Bücher vorstellen, zu Amazon
leiten, später auf buchwerk bewerten und Leser belohnen. Single Source of Truth
für dieses Feature.

Status: **Phase 1–3 gebaut** (Migrationen einspielen, siehe Abschnitt 6).

> ⚠️ **Abschnitt 4 ist in Teilen überholt.** Die Rezenzo-Begründung dort hält der
> Prüfung nicht stand (Rezenzos Punkte *sind* monetarisiert), und die
> Punkte-Kopplung an die Autor-Freigabe wurde am 15.07.2026 entfernt.
> Maßgeblich ist **`docs/LESEN-UND-BEWERTEN.md`** — dort stehen Recherche,
> Rechtslage, Kostenrechnung und der offene Entscheidungsbedarf.

---

## 1. Grundprinzip

- **Nur Buchwerk-Bücher.** Kein externer Katalog, keine manuelle Admin-Pflege.
- Ein Shop-Buch ist **kein eigener Datensatz**, sondern ein `projects`-Eintrag
  mit `shop_published = true`.
- **Opt-in durch den Autor:** Wer ein Buch fertiggestellt hat, kann es (als
  Abonnent) im Shop veröffentlichen. Titel, Cover und Klappentext werden
  **automatisch** aus den vorhandenen Daten übernommen.
- Kein Direktkauf bei buchwerk — der CTA „Bei Amazon kaufen" führt zu Amazon
  (Affiliate-Link).

---

## 2. Datenmodell (implementiert)

Keine neue Tabelle. Migration `20260711120000_projects_add_shop.sql` ergänzt
`public.projects`:

| Spalte | Zweck |
|---|---|
| `shop_published boolean` | im Shop sichtbar (Default false) |
| `shop_published_at timestamptz` | Veröffentlichungszeitpunkt (Sortierung) |
| `shop_slug text` (unique, partial) | stabile URL `/buchshop/<slug>` |
| `amazon_url text` | Ziel des „Bei Amazon kaufen"-CTA |

**Auto-Übernahme** der Shop-Anzeige aus vorhandenen Daten:
- Titel/Autor → `projects.title` / `projects.author`
- Untertitel/Klappentext → `kdp_listings.subtitle` / `.description`
- Cover → ausgewähltes `covers.image_url` (liegt im public Storage-Bucket)

**Lesepfad:** Öffentliche Shop-Seiten lesen serverseitig mit dem service-role
Client und filtern hart auf `shop_published = true` (`lib/shop/queries.ts`).
Deshalb bleiben die owner-only RLS-Policies unverändert — **keine anon-Policies**.

---

## 3. Was gebaut ist (Phase 1)

- Migration (Spalten + Indizes) — **einzuspielen** (siehe Abschnitt 6).
- `lib/shop/queries.ts` — `getPublishedBooks()`, `getPublishedBookBySlug()`.
- `lib/shop/actions.ts` — `publishToShopAction` / `unpublishFromShopAction`
  (Autor-eigen, **Abonnent** + **fertiges Buch** + gültiger Amazon-Link nötig;
  Slug wird automatisch/eindeutig erzeugt).
- `lib/shop/slug.ts`, `lib/shop/amazon.ts` (Affiliate-Tag via `AMAZON_PARTNER_TAG`).
- `lib/billing/access.ts` → `isSubscriber()`.
- Öffentliche Seiten: `app/buchshop/page.tsx` (Übersicht),
  `app/buchshop/[slug]/page.tsx` (Detail + Amazon-CTA `rel="sponsored nofollow"`).
- `components/buchwerk/shop-publish.tsx` + Sektion auf der Projekt-Seite
  (fehlertolerant: ohne Migration bleibt die Sektion einfach aus).
- Navigation: „Buchshop" in Landing-Header/-Footer und App-Header.

Pre-Launch-Gate: `/buchshop` liegt hinter dem bestehenden Gate — bis `SITE_LIVE=true`
öffentlich nicht sichtbar.

---

## 4. Bewertungen & Punkte — Modell A (entschieden 2026-07-11)

> ⚠️ **Korrektur 15.07.2026.** Der folgende Absatz war die tragende Begründung
> für Modell A und ist sachlich falsch. Prüfung der Primärquellen: Rezenzos
> Punkte sind über Digistore24 **mit Geld kaufbar**, und die „Externe
> Veröffentlichung" (= Amazon) **kostet 45 Punkte** — die Kette Geld → Punkte →
> Amazon-Rezension ist dort geschlossen. Rezenzo taugt nicht als
> Konformitätsbeleg. Details: `docs/LESEN-UND-BEWERTEN.md` §2.4.
>
> Die Regeln unten (sentiment-neutral, kein Geldwert, kein Amazon-Bezug) bleiben
> richtig — nur nicht, weil Rezenzo sie vormacht, sondern weil UWG und Amazons
> Regeln sie verlangen.

~~Vorbild: Rezenzo. Deren Punkte sind bewusst **kein Geldwert** („Punkte können
nicht als Geld ausgezahlt werden"), sondern ein rein **internes
Plattforminstrument**, unabhängig von der Sternebewertung. Genau diese
Nicht-Monetarisierung hält das Modell Amazon-ToS- und UWG-konform.~~ Buchwerk
übernimmt dieses Prinzip.

**Verworfen:** Punkte/Geld **für Amazon-Bewertungen** und jede Umwandlung
Punkte → € / Abo-Rabatt. Das wäre wirtschaftlich eine bezahlte Bewertung →
Amazon-Konto-/KDP-Sperre, UWG-Abmahnung.

### Regeln (verbindlich)

1. **Verdient** werden Punkte nur durch eine **buchwerk-interne** Bewertung
   eines *fremden* Buchs — nicht des eigenen, nicht auf Amazon.
2. **Sentiment-neutral:** die Punktzahl hängt **nicht** von den Sternen ab.
3. **Autor-Freigabe steuert nur die Sichtbarkeit, nie die Punkte** (geändert
   15.07.2026). Punkte gibt es bei der Abgabe. Der bewertete Autor darf nicht
   entscheiden, ob der Rezensent bezahlt wird — sonst ist die Belohnung faktisch
   sentiment-abhängig (2 Sterne → Ablehnung → kein Geld), und genau das hat das
   OLG Frankfurt (6 U 232/21) als sachfremden Einfluss gewertet. Eine Ablehnung
   muss begründet werden (Art. 17 DSA) und holt keine Punkte zurück. Missbrauch
   regelt der Betreiber per negativem Ledger-Eintrag.
4. **2-Stunden-Lesesperre:** Bewerten ist erst 2 h nach dem „Ich lese dieses
   Buch"-Vermerk (`shop_acquisitions`) möglich.
5. **Punkte sind nie Geld/Abo-Rabatt.** Einlösen ausschließlich **intern** —
   das eigene Buch in den Review-Pool geben / im Shop „boosten".
6. **Transparenz:** belohnte Bewertungen werden gekennzeichnet; eine Bewertung
   pro Buch/Nutzer.
7. **Amazon-Bewertung** bleibt ein **freiwilliger, unbezahlter** CTA.

### Datenmodell (Phase 2)

- `shop_acquisitions` — „ich lese dieses Buch" (kind: pdf/kindle/kauf),
  `acquired_at` startet die 2h-Sperre.
- `shop_reviews` — rating (1..5), body, status (pending/approved/rejected),
  Autor-Moderation; Unique(book_id, user_id).
- `point_ledger` — interner Punktestand (delta, reason, ref); Saldo = Summe.
  **Kein** Cent-/€-Feld, keine Auszahlung.

---

## 5. Phasenplan

- **Phase 1 — Schaufenster:** ✅ gebaut (Migration ausstehend).
- **Phase 2 — Bewertungen + Punkte** (Modell A): Erwerbsvermerk, 2h-Sperre,
  Bewertung, Autor-Freigabe, Ø-Anzeige, internes Punktekonto. ⏳ in Arbeit.
- **Phase 3 — Punkte einlösen** (intern): ✅ gebaut. Autor setzt Punkte ein, um
  das eigene veröffentlichte Buch zu „boosten" (Standard: 30 Punkte → 7 Tage
  hervorgehoben, „Sucht Bewertungen"-Badge, oben im Shop). Verbucht als
  negativer `point_ledger`-Eintrag; `projects.boosted_until`. Kein Geldwert.

---

## 6. To-do vor dem Live-Gang

1. **Migrationen einspielen** (Supabase-Dashboard SQL-Editor oder CLI):
   - `20260711120000_projects_add_shop.sql` — Shop-Spalten. Vorher: Buchshop
     bricht nicht, bleibt nur leer / Sektion aus.
   - `20260711130000_buchshop_reviews.sql` — Bewertungen + Punkte.
   - `20260711140000_projects_add_boost.sql` — Boost.
   - `20260715120000_chapters_add_generation_count.sql` — Kapitel-Deckel
     **+ Spalten-Allowlist für `chapters`** (schließt eine Altlast: bisher konnte
     ein Nutzer beliebige Kapitel-Spalten per PostgREST schreiben). Ohne die
     Migration läuft der Deckel best-effort ins Leere, die Generierung bricht aber
     nicht.
   - `20260715130000_shop_reviews_add_rejection_reason.sql` — Art.-17-Begründung.
     **Ohne diese Migration schlägt das Ablehnen fehl** (die Spalte fehlt) —
     anders als die übrigen ist sie nicht best-effort.
2. **`AMAZON_PARTNER_TAG`** (Env) setzen, sonst wird der rohe Amazon-Link genutzt.
   Offen: `meinersterh0c-21` ist der meinersterhund-Tag; buchwerk.info sollte als
   eigene Traffic-Quelle im Partnerprogramm registriert werden.
3. **Entscheidung offen** (siehe `docs/LESEN-UND-BEWERTEN.md` §7): Testleser-Kreis
   vs. Weiterbau der Shop-Bewertungen. Beide brauchen zuerst den Reader.
4. **Vor Live-Gang zu klären:** Der Autor kuratiert derzeit die Sichtbarkeit der
   Bewertungen seines eigenen Buches. Das ist im Transparenzblock offengelegt
   (`review-disclosure.tsx`), bleibt aber ein Interessenkonflikt im Aggregat.
