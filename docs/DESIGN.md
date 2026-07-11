# DESIGN.md — Buchwerk.info

**Single Source of Truth für alle Design-Entscheidungen.**
Wenn etwas hier steht und im Code anders ist, ist der Code falsch — nicht dieses Dokument.

Aktuelles System: **„Studio"** (seit 2026-07-11). Vorgänger „Werkstatt 3b" siehe Änderungshistorie.

---

## 1. Farbpalette „Studio"

Warmes Paper als Grund, weiße Karten für Tiefe, kräftiges Flaschengrün als CTA,
Clay (Terracotta) als sparsamer Akzent. Positionierung: modern, klar, app-nah —
Werkstatt-/Verlags-Charakter, aber mit mehr Struktur und Farbe als der Vorgänger.

### 1.1 Tokens (Light-Mode)

| Rolle | Token | HEX | Verwendung |
|---|---|---|---|
| Hintergrund (Paper) | `--background` | `#EFEDE7` | Body, große Flächen |
| Vordergrund (Ink) | `--foreground` | `#17140F` | Fließtext, Headlines |
| Karte (Surface) | `--card` | `#FFFFFF` | weiße Karten auf Paper |
| Karte-Vordergrund | `--card-foreground` | `#17140F` | Text auf Karten |
| Text sekundär | `--muted-foreground` | `#6B6459` | Begleittext, Labels |
| Muted-Fläche | `--muted` | `#F7F5F0` | weiche Felder (Textareas, KDP-Felder) |
| Akzent / CTA | `--primary` | `#1C6B43` | Primärbuttons, aktive Links, Fokus-Ringe |
| Akzent-Vordergrund | `--primary-foreground` | `#FFFFFF` | Text auf Primärbuttons |
| Sekundär | `--secondary` | `#EFEDE7` | Sekundärbuttons |
| Rahmen | `--border` | `#E4E0D6` | Linien, Karten-Ränder |
| Input-Rahmen | `--input` | `#DCD6C8` | Form-Felder |
| Fokus-Ring | `--ring` | `#1C6B43` | Outline bei Tastatur-Fokus |
| Fehler | `--destructive` | `#A8391A` | Fehlertext, Warnungen |
| Canvas | `--canvas` | `#E4E0D6` | dunkelstes Paper (optionale Seitenfläche) |
| Clay (dekorativ) | `--clay` | `#C4744F` | dekorative Akzente (Fills, Kreise) |
| Clay (Text) | `--clay-strong` | `#A8562F` | Clay als Text (Nummern), AA-tauglich |
| Erfolg | `--success` / `--success-tint` | `#1C6B43` / `#E6F0E9` | Status „Fertig" (Chip) |
| Warnung/Entwurf | `--warning-tint` | `#F7EAE2` | Status „Entwurf / in Arbeit" (Chip-Fläche, Clay-Text) |

### 1.2 CSS-Variablen

Vollständig in `app/globals.css` unter `:root`. Farb-Utilities werden über
`@theme inline` als Tailwind-Klassen verfügbar gemacht (`bg-card`, `text-primary`,
`text-clay-strong`, `bg-success-tint`, `bg-warning-tint` usw.).

### 1.3 Dark-Mode

Dark-Mode ist im MVP **bewusst nicht aktiviert** (siehe CLAUDE.md → Styling-Regeln).

---

## 2. WCAG-Kontrastprüfung

Für Body-Text gilt AA normal (≥ 4.5 : 1) als Mindestanforderung.

| Vordergrund | Hintergrund | Kontrast | Bewertung |
|---|---|---|---|
| `--foreground` (`#17140F`) | `--background` (`#EFEDE7`) | ~16 : 1 | AAA |
| `--foreground` (`#17140F`) | `--card` (`#FFFFFF`) | ~18 : 1 | AAA |
| `--muted-foreground` (`#6B6459`) | `--background` (`#EFEDE7`) | ~5.0 : 1 | AA normal |
| `--muted-foreground` (`#6B6459`) | `--card` (`#FFFFFF`) | ~5.5 : 1 | AA normal |
| `--primary-foreground` (`#FFFFFF`) | `--primary` (`#1C6B43`) | ~5.9 : 1 | AA normal, AAA large |
| `--clay-strong` (`#A8562F`) als Text | `--card` (`#FFFFFF`) | ~4.7 : 1 | AA normal |
| `--clay-strong` (`#A8562F`) als Text | `--warning-tint` (`#F7EAE2`) | ~4.3 : 1 | AA large / Chips (Bold) |
| `--success` (`#1C6B43`) als Text | `--success-tint` (`#E6F0E9`) | ~5.0 : 1 | AA normal |

**Regel:** Clay wird als Text ausschließlich in der dunkleren Variante
`--clay-strong` verwendet. Das hellere `--clay` (`#C4744F`) ist rein dekorativ
(Fills, Kreise) und trägt keinen kritischen Text. Neue Kombinationen hier ergänzen.

---

## 3. Typografie

### 3.1 Schriften — self-hosted, kein Google-CDN

Zwei Schriften, beide self-hosted via `@fontsource-variable/*` (DSGVO — kein
externer Request):

- **Display:** Bricolage Grotesque Variable (`@fontsource-variable/bricolage-grotesque`)
  → Headlines und Wortmarke. Utility-Klasse `.font-display` (setzt Family +
  `letter-spacing: -0.02em`). Weights 600–800.
- **Body:** Instrument Sans Variable (`@fontsource-variable/instrument-sans`)
  → alles andere. Default `--font-sans`. Weights 400–600.

Import in `app/layout.tsx`. Family-Namen: `"Bricolage Grotesque Variable"`,
`"Instrument Sans Variable"`.

### 3.2 Verwendung

| Element | Klassen |
|---|---|
| Hero-Headline | `font-display text-5xl/6xl/7xl font-extrabold tracking-tight` |
| Section-Headline | `font-display text-3xl/4xl font-bold tracking-tight` |
| Karten-/Sub-Headline | `font-display text-lg/xl font-semibold` |
| Nummern-Label | `font-display font-bold` (Clay via `text-clay-strong` oder `text-primary`) |
| Fließtext | Instrument Sans, `text-base` |
| Begleittext/Labels | `text-sm text-muted-foreground` |

---

## 4. Formen & Radien

- `--radius: 0.75rem` (12px) als Basis
- **Karten:** `rounded-2xl` (~18px), weiß auf Paper, `border-border`
- **CTAs / Buttons:** `rounded-full` (Pill) — siehe `components/ui/button.tsx`
- **Inputs:** `rounded-xl`, weiße Fläche (`bg-card`)
- **Status-Chips:** `rounded-lg`, siehe `components/buchwerk/status-badge.tsx`

---

## 5. Komponenten-Bausteine

- **Button** (`components/ui/button.tsx`): Pill-Form. Varianten `default` (grün),
  `ink` (dunkel), `secondary` (Paper), `outline`, `ghost`, `destructive`, `link`.
- **StatusBadge** (`components/buchwerk/status-badge.tsx`): `done` (grün),
  `draft` (clay), `neutral` (gedämpft).
- **Wordmark** (`components/buchwerk/wordmark.tsx`): grünes Badge mit Buch-Glyph +
  „buchwerk." in Display-Schrift.
- **Fortschrittsbalken:** `h-2 rounded-full bg-input` mit `bg-primary`-Füllung
  (Breite als einziger zulässiger Inline-Style, weil Laufzeitwert).

---

## 6. Fokus-Zustände

Tastatur-Fokus sichtbar und farbig (Flaschengrün-Ring), nicht nur Systemring.
Umsetzung über die `focus-visible:ring-*`-Utilities in Button/Input.

---

## 7. Änderungshistorie

- **2026-04-18** — initial, Palette „Werkstatt 3b" (Sand `#F5F1EB`, Flaschengrün
  `#2E6B3D`), Inter Variable 400/500.
- **2026-07-11** — Redesign auf **„Studio"** (Vorlage: Claude-Design
  „Buchwerk Studio.dc.html"). Paper `#EFEDE7` + weiße Karten, Grün `#1C6B43`,
  Clay-Akzent `#C4744F`. Typografie neu: Bricolage Grotesque (Display) +
  Instrument Sans (Body), beide self-hosted. Buttons als Pills, Status-Chips,
  Fortschrittsbalken. Inter entfernt.
