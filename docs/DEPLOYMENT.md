# DEPLOYMENT.md — Buchwerk.info

**Single Source of Truth für Hosting, Pre-Launch-Gate und Betriebs-Setup.**
Wenn etwas hier steht und in der Realität anders ist, erst hier prüfen, dann anpassen — und Änderungen hier nachziehen.

---

## 1. Hosting

- **Frontend + API:** Vercel, Projekt `buchwerk` (Region `fra1`, Frankfurt).
- **Deploy-Quelle:** GitHub `bky311-sys/buchwerk`, Branch **`main`** → Vercel deployt `origin/main` automatisch. Was auf `main` gepusht wird, ist live.
- **Datenbank/Auth/Storage:** Supabase (Frankfurt).
- Lokaler Clone und `origin/main` können auseinanderlaufen — **vor Arbeit immer `git fetch` + Stand vergleichen.** (Am 2026-06-14 war ein lokaler Clone 14 Commits hinter und 3 divergente Commits voraus; per `git reset --hard origin/main` bereinigt.)

---

## 2. Pre-Launch-Gate (Coming-Soon)

Solange noch nicht öffentlich gestartet wird, sieht die Öffentlichkeit nur die **„Bald verfügbar"-Seite** (`/bald`). Implementiert in `middleware.ts` → `maintenanceGate()`.

### So funktioniert es
- **Aktiv, solange** Env `SITE_LIVE` **≠** `"true"`. Sobald `SITE_LIVE=true` (Vercel-Env) gesetzt ist, ist die Seite öffentlich und das Gate aus.
- Öffentliche Besucher werden per `rewrite` auf `/bald` geleitet (URL bleibt, Inhalt = Coming-Soon).
- **Ausnahmen, die immer erreichbar bleiben:** `/api/*` (z. B. Stripe-Webhook) und `/bald` selbst.

### Bypass für Benjamin (sehen + bearbeiten)
- **Freischalt-Cookie:** `bw_preview`, Wert muss exakt dem Env `SITE_BYPASS_TOKEN` entsprechen.
- **Entsperren:** beliebige URL mit `?preview=<SITE_BYPASS_TOKEN>` aufrufen, z. B.
  `https://buchwerk.info/?preview=DEIN_TOKEN`
  → Middleware setzt den Cookie `bw_preview` (httpOnly, SameSite=Lax, 30 Tage Gültigkeit) und lädt ohne den Parameter neu.
- Danach ist die **echte Seite inklusive `/admin`** für diesen Browser sichtbar, bis der Cookie abläuft/gelöscht wird.

### ⚠️ Konsequenz für Tooling (wichtig)
Ein `curl`/WebFetch **ohne** den `bw_preview`-Cookie bekommt für **jede** URL die `/bald`-Seite (`x-matched-path: /bald`). Daraus darf **nie** geschlossen werden, eine Route existiere nicht — **Routen-Existenz ausschließlich am Code prüfen**, nicht am anonymen HTTP-Request.

---

## 3. Admin-Bereich

- **Route:** `/admin` (`app/(app)/admin/`). Aktuell eine Überblicksseite: Stats, Nutzerliste (mit Plan-Toggle), Warteliste-Anmeldungen.
- **Zugang:** doppelt gesichert —
  1. Pre-Launch-Gate (Abschnitt 2), und
  2. Admin-Allowlist: `lib/admin/access.ts` → `getAdminUser()` prüft die eingeloggte Mail gegen Env **`ADMIN_EMAILS`** (kommagetrennt). Nicht-Admins bekommen `notFound()` (404), erfahren also nichts von der Existenz.
- Daten-Reads im Admin laufen über den service_role-Client (`lib/supabase/admin.ts`, umgeht RLS, nur server-seitig).
- Admin-Mutationen als Server Actions in `lib/admin/actions.ts` (prüfen `getAdminUser()` erneut, dann `revalidatePath`).

---

## 4. Environment-Variablen

`.env.example` ist veraltet und listet nur die Supabase-Keys. Tatsächlich vom Code (`process.env.*`) genutzt:

| Variable | Zweck |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Client (anon, respektiert RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin-Client (umgeht RLS, nur server-seitig) |
| `ADMIN_EMAILS` | Kommagetrennte Admin-Allowlist (Abschnitt 3) |
| `SITE_LIVE` | `"true"` schaltet das Pre-Launch-Gate aus |
| `SITE_BYPASS_TOKEN` | Token für den `bw_preview`-Bypass-Cookie |
| `RESEND_API_KEY` | Email-Versand (Resend), Absender `welcome@buchwerk.info` |
| `ANTHROPIC_API_KEY` | Claude API (Gliederung, Kapitel, Lektorat) |
| `REPLICATE_API_TOKEN` | Flux Cover-Generierung |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Stripe Zahlung + Webhook-Verifizierung |
| `STRIPE_PRICE_BOOK` / `STRIPE_PRICE_SUB` | Stripe Price-IDs (Einmalkauf / Abo) |
| `NEXT_PUBLIC_SENTRY_DSN` / `SENTRY_AUTH_TOKEN` | Fehler-Monitoring (EU) |

**TODO:** `.env.example` auf diese Liste aktualisieren (ohne Werte).

---

*Stand: 2026-06-14*
