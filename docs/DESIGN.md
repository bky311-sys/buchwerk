# DESIGN.md — Buchwerk.info

**Single Source of Truth für alle Design-Entscheidungen.**
Wenn etwas hier steht und im Code anders ist, ist der Code falsch — nicht dieses Dokument.

---

## 1. Farbpalette „Werkstatt 3b"

Erdtöne mit Flaschengrün als Akzent. Positionierung: Werkstatt, Verlag, Handwerk — bewusster Gegenentwurf zum typischen Silicon-Valley-SaaS-Look.

### 1.1 Tokens (Light-Mode)

| Rolle | Token | HEX | Verwendung |
|---|---|---|---|
| Hintergrund | `--background` | `#F5F1EB` | Body, große Flächen |
| Vordergrund (Text primär) | `--foreground` | `#1F1B15` | Fließtext, Headlines |
| Text sekundär | `--muted-foreground` | `#6B5E4F` | Begleittext, Labels, Platzhalter |
| Card-Hintergrund | `--card` | `#F5F1EB` | identisch mit Hintergrund (flache Hierarchie) |
| Card-Vordergrund | `--card-foreground` | `#1F1B15` | Text auf Cards |
| Akzent / CTA | `--primary` | `#2E6B3D` | Primärbuttons, aktive Links, Fokus-Ringe |
| Akzent-Vordergrund | `--primary-foreground` | `#FFFFFF` | Text auf Primärbuttons |
| Rahmen | `--border` | `#D6CDBF` | Linien, Card-Ränder, Inputs |
| Input-Rahmen | `--input` | `#D6CDBF` | Form-Felder (identisch mit Border) |
| Muted-Fläche | `--muted` | `#EDE7DC` | subtile Hintergrundfläche (z. B. Code-Blocks) |
| Fokus-Ring | `--ring` | `#2E6B3D` | Outline bei Tastatur-Fokus |
| Fehler | `--destructive` | `#A8391A` | Fehlertext, Warnungen |
| Fehler-Vordergrund | `--destructive-foreground` | `#FFFFFF` | Text auf Fehler-Flächen |

### 1.2 CSS-Variablen

```css
:root {
  /* Surface */
  --background: #F5F1EB;
  --foreground: #1F1B15;
  --card: #F5F1EB;
  --card-foreground: #1F1B15;
  --popover: #F5F1EB;
  --popover-foreground: #1F1B15;

  /* Text hierarchy */
  --muted: #EDE7DC;
  --muted-foreground: #6B5E4F;

  /* Accent / CTA */
  --primary: #2E6B3D;
  --primary-foreground: #FFFFFF;
  --secondary: #EDE7DC;
  --secondary-foreground: #1F1B15;
  --accent: #EDE7DC;
  --accent-foreground: #1F1B15;

  /* Borders & Inputs */
  --border: #D6CDBF;
  --input: #D6CDBF;
  --ring: #2E6B3D;

  /* Feedback */
  --destructive: #A8391A;
  --destructive-foreground: #FFFFFF;

  --radius: 0.5rem;
}
```

### 1.3 Dark-Mode

Dark-Mode ist im MVP **bewusst nicht aktiviert** (siehe CLAUDE.md → Styling-Regeln). Die `.dark { ... }`-Variante wird ergänzt, sobald wir eine Entscheidung getroffen haben, was der Dark-Mode zur Marke beiträgt. Bis dahin: keine Platzhalter, die später falsch sein könnten.

---

## 2. WCAG-Kontrastprüfung

Alle Kombinationen, die in der UI auftreten können, mit errechnetem Kontrast nach WCAG 2.1:

| Vordergrund | Hintergrund | Kontrast | Bewertung |
|---|---|---|---|
| `--foreground` (`#1F1B15`) | `--background` (`#F5F1EB`) | **15.0 : 1** | AAA (normal + large) |
| `--muted-foreground` (`#6B5E4F`) | `--background` (`#F5F1EB`) | **5.5 : 1** | AA normal, AAA large |
| `--primary-foreground` (`#FFFFFF`) | `--primary` (`#2E6B3D`) | **6.3 : 1** | AA normal, AAA large |
| `--destructive-foreground` (`#FFFFFF`) | `--destructive` (`#A8391A`) | **6.5 : 1** | AA normal, AAA large |
| `--destructive` (`#A8391A`) als Text | `--background` (`#F5F1EB`) | **5.7 : 1** | AA normal, AAA large |
| `--foreground` (`#1F1B15`) | `--muted` (`#EDE7DC`) | **13.2 : 1** | AAA |
| `--border` (`#D6CDBF`) | `--background` (`#F5F1EB`) | 1.4 : 1 | nur dekorativ (Linien), nicht für Text |

**Regel:** Für Body-Text gilt AA normal (≥ 4.5 : 1) als Mindestanforderung. Alle aktuell spezifizierten Text-/Hintergrund-Kombinationen erfüllen das. Wenn neue Kombinationen im Code auftauchen, hier ergänzen und prüfen.

---

## 3. Typografie

### 3.1 Schrift

**Inter Variable** — eine einzige Schrift für die ganze Plattform, self-hosted via `@fontsource-variable/inter`.

- Kein Google Fonts CDN (DSGVO-kritisch, siehe CLAUDE.md)
- Kein Serif-Akzent
- Variable-Font: Weights kommen aus derselben Datei, kein separates Laden pro Weight

### 3.2 Verwendete Weights

Nur zwei Weights werden tatsächlich eingesetzt:

- **400 (Regular)** — Fließtext, Labels, Default
- **500 (Medium)** — Headlines (h1–h4), Button-Text, Hervorhebungen

Weitere Weights werden nicht verwendet. Wenn ein Entwurf mehr Gewichte verlangt, erst hier diskutieren, dann eintragen.

### 3.3 Textskala

Tailwind-Default-Skala. Typische Anwendung:

| Klasse | Größe / Line-Height | Verwendung |
|---|---|---|
| `text-5xl font-medium` | 48 / 1 | Hero-Headline |
| `text-3xl font-medium` | 30 / 2.25rem | Section-Headline |
| `text-xl font-medium` | 20 / 1.75rem | Subheadline |
| `text-base` | 16 / 1.5rem | Fließtext |
| `text-sm text-muted-foreground` | 14 / 1.25rem | Begleittext, Labels |
| `text-xs` | 12 / 1rem | Footer, Meta, Formular-Fehler |

### 3.4 Tracking & Leading

- Headlines: `tracking-tight` (-0.025em) — kompakter, buchtypografischer Look
- Body: Default-Tracking (0)
- Lange Textspalten: `leading-relaxed` für Lesetexte > 3 Zeilen

---

## 4. Spacing

Tailwind-Default-Skala (4-px-Basis). Kein eigenes Spacing-System — wenn wir später Tokens brauchen (`spacing-page`, `spacing-section`), hier ergänzen.

**Faustregeln:**

- Sektionen auf der Landing Page: vertikaler Abstand `py-16` bis `py-24`
- Card-Innenabstand: `p-6`
- Abstand zwischen verwandten Elementen (z. B. Label → Input): `space-y-2`
- Abstand zwischen unterschiedlichen Blöcken in einer Card: `space-y-6`
- Max. Textspaltenbreite für Lesbarkeit: `max-w-prose` (~65 Zeichen) bei Fließtext

---

## 5. Formen & Radien

- `--radius: 0.5rem` (8 px) als Default — moderat gerundet, nicht verspielt
- Buttons, Inputs, Cards verwenden diese Radius-Variable
- Keine doppelt gerundeten Formen (nested Cards mit großem Radius im großen Radius)

---

## 6. Fokus-Zustände

Tastatur-Fokus ist **sichtbar und farbig**, nicht nur ein schwacher Systemring.

```css
/* Default-Pattern für alle interaktiven Elemente */
outline: 2px solid var(--ring);
outline-offset: 2px;
```

Begründung: Barrierefreiheit, Tastaturnutzung muss gleichwertig zu Maus sein. Das Flaschengrün des Rings ist auf Sand-Hintergrund deutlich erkennbar.

---

## 7. Änderungshistorie

- **2026-04-18** — initial, Palette „Werkstatt 3b" (Flaschengrün-Variante), Inter Variable 400/500
