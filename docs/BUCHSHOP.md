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

## 4. Bewertungen & Belohnung (Phase 2/3 — noch offen)

Geplante Journey: Erwerbsart (PDF/Kindle/Kauf) angeben → auf buchwerk bewerten →
Autor gibt frei → Ø-Anzeige. Optional Amazon-Bewertung. Belohnung 1 €/Bewertung
auf den nächsten Abomonat, Cap 10 €/Monat, Bewerten erst 2 h nach Freischalten.

### Rechtlicher Kern — WICHTIG

„Geld gegen **Amazon**-Bewertung" ist nicht umsetzbar:
- **Amazon-Richtlinien:** incentivierte Reviews sind ausnahmslos verboten →
  Löschung, Konto-/KDP-Sperre.
- **UWG (§ 5b Abs. 3, § 5a):** bezahlte/incentivierte Bewertungen sind
  offenlegungspflichtig; gekauftes Wohlwollen ist abmahnbar.

**Empfohlene, saubere Variante (Default):**
1. Belohnt wird die **buchwerk-eigene, verifizierte** Bewertung — nicht die
   Amazon-Bewertung.
2. **Unabhängig vom Sterne-Ergebnis** (kein Kauf positiver Meinung).
3. Amazon-Bewertung bleibt ein **unbezahlter**, freiwilliger Link.
4. Transparente Kennzeichnung belohnter Bewertungen; Cap 10 €/Monat; eine
   Bewertung pro Buch/Nutzer; verifizierter Bezug + Autor-Freigabe.

> **Offene Produktentscheidung (blockt Phase 3):** saubere Variante ok — oder
> bewusst ein anderes Modell mit den o. g. Risiken?

Datenmodell-Skizze Phase 2/3: `shop_acquisitions` (Bezug + Start der 2h-Sperre),
`shop_reviews` (rating/body/status, Autor-Moderation), `reward_credits`
(Cent-Gutschrift, Monats-Cap, Anbindung an Stripe-Guthaben/Coupon).

---

## 5. Phasenplan

- **Phase 1 — Schaufenster:** ✅ gebaut (Migration ausstehend).
- **Phase 2 — Bewertungen** mit Erwerbsart, 2h-Sperre, Autor-Freigabe, Ø-Anzeige.
- **Phase 3 — Gutschrift-System** (nach Entscheidung Abschnitt 4).

---

## 6. To-do vor dem Live-Gang

1. **Migration einspielen:** `supabase/migrations/20260711120000_projects_add_shop.sql`
   (Supabase-Dashboard SQL-Editor oder CLI). Vorher: Buchshop bricht nicht,
   bleibt nur leer / Sektion aus.
2. **`AMAZON_PARTNER_TAG`** (Env) setzen, sonst wird der rohe Amazon-Link genutzt.
3. Entscheidung Belohnungsmodell (Abschnitt 4) → Phase 2/3.
