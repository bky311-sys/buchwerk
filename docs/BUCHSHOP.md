# BUCHSHOP.md — Buchwerk.info

**Modul „Buchshop"** — bei Buchwerk entstandene Bücher vorstellen, zu Amazon
leiten, später auf buchwerk bewerten und Leser belohnen. Single Source of Truth
für dieses Feature.

Status: **Phase 1 gebaut** (Migration muss noch eingespielt werden). Phase 2/3 offen.

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

Vorbild: Rezenzo. Deren Punkte sind bewusst **kein Geldwert** („Punkte können
nicht als Geld ausgezahlt werden"), sondern ein rein **internes
Plattforminstrument**, unabhängig von der Sternebewertung. Genau diese
Nicht-Monetarisierung hält das Modell Amazon-ToS- und UWG-konform. Buchwerk
übernimmt dieses Prinzip.

**Verworfen:** Punkte/Geld **für Amazon-Bewertungen** und jede Umwandlung
Punkte → € / Abo-Rabatt. Das wäre wirtschaftlich eine bezahlte Bewertung →
Amazon-Konto-/KDP-Sperre, UWG-Abmahnung.

### Regeln (verbindlich)

1. **Verdient** werden Punkte nur durch eine **buchwerk-interne** Bewertung
   eines *fremden* Buchs — nicht des eigenen, nicht auf Amazon.
2. **Sentiment-neutral:** die Punktzahl hängt **nicht** von den Sternen ab.
3. **Autor-Freigabe:** Punkte werden erst gutgeschrieben, wenn der Autor die
   Bewertung freigibt (Qualitäts-/Spam-Schutz).
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
- **Phase 3 — Punkte einlösen** (intern): eigenes Buch boosten / in den
  Review-Pool geben. Später.

---

## 6. To-do vor dem Live-Gang

1. **Migration einspielen:** `supabase/migrations/20260711120000_projects_add_shop.sql`
   (Supabase-Dashboard SQL-Editor oder CLI). Vorher: Buchshop bricht nicht,
   bleibt nur leer / Sektion aus.
2. **`AMAZON_PARTNER_TAG`** (Env) setzen, sonst wird der rohe Amazon-Link genutzt.
3. Entscheidung Belohnungsmodell (Abschnitt 4) → Phase 2/3.
