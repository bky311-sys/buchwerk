# UX-Workflow-Konzept — Buchwerk

**Status:** Entwurf zum Review · 2026-07-13
**Zweck:** Den Weg vom Thema bis zum veröffentlichten Buch als klaren, geführten Prozess neu strukturieren. Grundlage für die schrittweise Umsetzung.

Dieses Dokument beschreibt **nur den Workflow/die UX** — nicht das Produktkonzept (das steht in `KONZEPT.md`) und nicht das visuelle Design (Tokens in `docs/DESIGN.md`, Design-Quelle „Buchwerk Studio.dc.html").

---

## 1. Problem heute

Der Ablauf *behauptet* einen Prozess (es gibt einen `WorkflowStepper`), hält ihn aber nicht ein:

- **Cover** und **KDP-Listing** sind eigene, fokussierte Seiten. ✅
- **Schreiben, Impressum, Veröffentlichen, Shop, Gliederung-neu** liegen dagegen **alle gestapelt auf einer einzigen Projektseite** (`app/(app)/projekte/[id]/page.tsx`). ❌

Diese Seite zeigt gleichzeitig: Freischalt-Gate, Fortschritt, zwei Stepper, Batch-Schreiben, alle Kapitel mit Editoren, Impressum-Formular, Publish-Guide, Shop-Publish, Review-Moderation, Gliederungs-Aktionen. Das ist die Überforderung — der Nutzer sieht alles auf einmal und weiß nicht, was jetzt dran ist.

**Kern:** Die Struktur ist inkonsistent (teils Seiten, teils Sektionen) und nicht geführt.

---

## 2. Zielbild

Ein Buch entsteht **nicht streng linear** — man springt zwischen Kapiteln, feilt am Cover nach, kommt später zum Veröffentlichen zurück. Deshalb **kein starrer Vor-/Zurück-Wizard**, sondern:

> **Hub-and-Spoke:** Ein ruhiges Projekt-Cockpit (Hub) als Zentrum, von dem aus jede Phase eine eigene, fokussierte Seite (Spoke) ist. Der Hub zeigt jederzeit: „Wo stehe ich, was ist der nächste Schritt?" — und lässt gezielt in jeden Schritt springen.

Jede Spoke-Seite macht **genau eine Sache**. Der Hub trägt die Orientierung.

### Leitprinzipien
1. **Eine Seite, eine Aufgabe.** Keine Seite zeigt mehr als einen Schritt.
2. **Immer ein klarer „nächster Schritt".** Genau ein primärer CTA sichtbar.
3. **Fortschritt ist sichtbar und ehrlich.** Erledigt/aktuell/offen pro Schritt, echte Signale (geschriebene Kapitel, gewähltes Cover, existierendes Listing).
4. **Kostenlos vor der Zahlung.** Idee + Gliederung ohne Zahlung; die Bezahlschranke sitzt an genau einer Stelle (Übergang zum Schreiben).
5. **Nichts geht verloren.** Rücksprung in jeden Schritt jederzeit möglich; Statusanzeigen überleben Reloads (schon so gebaut).

---

## 3. Der Flow im Überblick

```
/projekte  ──►  Neues Projekt: Idee + Zielgruppe  ──►  [Gliederung generiert]
   (Liste)          (kostenlos)                              │
                                                             ▼
                                          ┌──────────  PROJEKT-HUB  ──────────┐
                                          │      /projekte/[id]  (Cockpit)    │
                                          │  Fortschritt · Stepper · nächster │
                                          │            Schritt                │
                                          └──┬────────┬────────┬────────┬─────┘
                                             ▼        ▼        ▼        ▼
                                        1 Schreiben 2 Cover  3 KDP   4 Veröffentl.
                                         (Bezahl-   (bezahlt)(bezahlt)(bezahlt)
                                          schranke)
```

**Schritt-Reihenfolge (der „Spine"):**

| # | Schritt | Seite | Bezahlung | Erledigt-Signal |
|---|---------|-------|-----------|------------------|
| 0 | **Idee & Zielgruppe** | `/projekte` (Anlegen) | kostenlos | Projekt existiert, Gliederung erzeugt |
| — | **Gliederung prüfen** | Hub (oder eigene leichte Ansicht) | kostenlos | Nutzer startet das Schreiben |
| 1 | **Schreiben** | `/projekte/[id]/schreiben` *(neu)* | **Freischaltung hier** | alle Kapitel haben Inhalt |
| 2 | **Cover** | `/projekte/[id]/cover` *(existiert)* | bezahlt | ein Cover ist gewählt |
| 3 | **KDP-Listing** | `/projekte/[id]/kdp` *(existiert)* | bezahlt | Listing existiert |
| 4 | **Veröffentlichen** | `/projekte/[id]/veroeffentlichen` *(neu)* | bezahlt | (extern, kein Auto-Signal) |

---

## 4. Die Seiten im Detail

### 0 · Idee & Zielgruppe  (`/projekte`, Anlegen)
**Aufgabe:** Aus einer Idee eine Gliederung machen — kostenlos, unverbindlich.
- Eingabe **Thema** (Pflicht) + **Zielgruppe** (neu, optional aber empfohlen — verbessert Gliederung & Kapitel; Feld `projects.audience` existiert schon).
- Optional später: Buch-Art (Sachbuch/Ratgeber/…) wie in KONZEPT Phase 0.
- Aktion erzeugt Titelvorschlag + Kapitel-Gliederung (synchron, ~2000 Tokens, wie heute) → Redirect in den **Hub**.
- Die Projektliste bleibt hier (Cockpit-Einstieg pro Buch).

**Delta zu heute:** Zielgruppen-Feld ergänzen. Sonst weitgehend vorhanden (`new-project-form.tsx`, `createProjectAction`).

### Hub · Projekt-Cockpit  (`/projekte/[id]`)
**Aufgabe:** Orientierung. Das ruhige Zentrum. **Kein Arbeitsbereich.**
Enthält nur:
- Titel (editierbar) + Thema/Zielgruppe.
- **Fortschritt**: Kapitel-Balken + Gesamt-Wortzahl (heute vorhanden).
- **WorkflowStepper** (Schreiben → Cover → KDP → Veröffentlichen) mit Status pro Schritt.
- **Genau ein primärer CTA**: der nächste offene Schritt („Weiter schreiben", „Cover erstellen", …).
- Vor Freischaltung: kompakte **Gliederungs-Vorschau** (Kapitelüberschriften + Kurzbeschreibung) mit „Gliederung anpassen" und dem Freischalt-CTA.

**Delta zu heute:** Radikal ausdünnen. Alles Arbeitende (Kapitel-Editoren, Impressum, Publish-Guide, Shop, Review-Moderation) wandert auf die Spoke-Seiten. Der Hub verliert ~80 % seines heutigen Inhalts.

### 1 · Schreiben  (`/projekte/[id]/schreiben`, **neu**)
**Aufgabe:** Nur Kapitel schreiben und überarbeiten.
- **Freischaltung sitzt hier** (erste Produktions-Aktion): nicht freigeschaltet → Bezahlschranke statt Kapitelliste (Link auf `/freischalten`).
- Nach Freischaltung: Batch-Schreiben + Kapitelliste mit Editoren/Generatoren (heutige Komponenten `batch-write`, `chapter-*`), Recherche läuft automatisch mit.
- Mindestlängen-/Wortzahl-Anzeige.
- Wenn alle Kapitel fertig → CTA „Weiter zum Cover".

**Delta:** Die Kapitel-Sektion der Mega-Seite hierher verschieben. Reine Umverdrahtung, kaum neue Logik.

### 2 · Cover  (`/projekte/[id]/cover`) — existiert
Bleibt. Ggf. konsistenter Kopf (Stepper/„zurück zum Hub"). Nach Auswahl → CTA „Weiter zum KDP-Listing".

### 3 · KDP-Listing  (`/projekte/[id]/kdp`) — existiert
Bleibt. Nach Erzeugung → CTA „Weiter zum Veröffentlichen".
(Nebenbaustelle, separat: `generateListingAction` ist noch blockierend ~20 s — später auf Trigger+Polling umstellen wie Kapitel/Cover.)

### 4 · Veröffentlichen  (`/projekte/[id]/veroeffentlichen`, **neu**)
**Aufgabe:** Alles zum Live-Gehen an einem Ort.
- **Impressum-Formular** (Pflicht vor Export) — `imprint-form.tsx`.
- **Downloads**: Manuskript-PDF + EPUB (erst wenn Impressum vollständig).
- **KDP-Anleitung**: `publish-guide.tsx` (Schritt-für-Schritt Upload).
- **Buchshop**: `shop-publish.tsx` + Review-Moderation (nur Abonnenten).

**Delta:** Die Sektionen Impressum/Downloads/Publish-Guide/Shop von der Mega-Seite hierher.

---

## 5. Navigations- & Statusmodell

- **Stepper** ist überall gleich (Hub + jede Spoke), zeigt `erledigt | aktuell | offen | optional` und verlinkt in die Schritte → konsistente Orientierung, freies Springen.
- **Rücksprung** immer möglich („← Zum Hub" / „← Alle Projekte").
- **„Nächster Schritt"-CTA** am Ende jeder Spoke führt linear weiter, ohne den Wizard zu erzwingen.
- **Erledigt-Erkennung** (schon vorhanden, wird wiederverwendet): Kapitel `content`, gewähltes Cover (`is_selected`), `kdp_listings`-Zeile. Veröffentlichen bleibt extern → nie „auto-erledigt".
- **Gating** bündelt sich am Übergang zu *Schreiben*: `gateProduction` (Einmalkauf/Abo). Hub + Gliederung bleiben kostenlos.

---

## 6. Zustände, die jede Seite abbilden muss

Für jede Spoke sauber gestalten (heute lückenhaft):
- **Leer** (noch nichts getan) — was tun, ein klarer CTA.
- **In Arbeit** (Generierung läuft) — Spinner + ehrlicher Text, Poller aktiv.
- **Fehler/steckengeblieben** — „Erneut versuchen" (Muster existiert).
- **Fertig** — Bestätigung + Weiter-CTA.
- **Gesperrt** (nicht freigeschaltet) — Bezahlschranke statt Inhalt.

---

## 7. Was sich NICHT ändert (bewusst)
- Datenmodell/DB (kein Schema-Umbau nötig für den Umbau).
- KI-Pipelines (Gliederung, Recherche, Kapitel, Cover, Listing).
- Bezahllogik (`gateProduction`), Rechtstexte, Widerruf.
- Bestehende Komponenten — sie werden **verschoben**, nicht neu gebaut.

## 8. Explizit außerhalb dieses Umbaus (später/KONZEPT V2)
Nischenanalyse/Marktvalidierung (Phase 1), mehrere Gliederungsvarianten, KI-Lektorat (Phase 4), 3D-Cover-Mockups, MOBI, Onboarding-Buchart-Auswahl. Nicht Teil dieses Workflow-Umbaus.

---

## 9. Entschieden (Review 2026-07-13)
Grundmodell **Hub-and-Spoke** bestätigt. Weiter:
1. **Gliederung prüfen** → **als Bereich im Hub** (kein eigener Schritt), bleibt kostenlos bis zur Freischaltung.
2. **Zielgruppe** → **beim Anlegen** abfragen (optionales Feld neben dem Thema).
3. **Schritt-Benennung** → **„Schreiben · Cover · Listing · Veröffentlichen"** (Zielgruppe kennt „Listing").
4. **Buchshop** → **Teil von „Veröffentlichen"** (kein eigener Bereich).
5. **Buch-Art** (Sachbuch/Ratgeber/…) → **später**, nicht in diesem Umbau (Reibung beim Start vermeiden).

---

## 10. Umsetzung in Schnitten (iterativ)
1. ~~**Schnitt 1 — größter Gewinn:** Seite `…/schreiben` rauslösen + Hub entschlacken.~~ **✅ erledigt (2026-07-13)**
2. ~~**Schnitt 2:** Seite `…/veroeffentlichen` (Impressum + Downloads + Publish-Guide + Shop) rauslösen; Hub weiter entschlacken.~~ **✅ erledigt (2026-07-13)** — inkl. prominentem „Nächster Schritt"-CTA am Hub und Freischalt-Hinweis an der Gliederung für gesperrte Bücher; Stepper-Labels auf „Schreiben · Cover · Listing · Veröffentlichen".
3. ~~**Schnitt 3:** Zielgruppe beim Anlegen + Gliederungs-Vorschau im Hub.~~ **✅ war bereits erledigt** — Zielgruppe wird beim Anlegen erfasst und fließt in die Gliederung; Vorschau lebt seit Schnitt 1 im Hub.
4. ~~**Schnitt 4:** Weiter-CTAs auf Cover-/KDP-Seiten.~~ **✅ erledigt (2026-07-14)** — Cover → „Weiter zum KDP-Listing", KDP → „Weiter zum Veröffentlichen".
5. **Separat (kein UX-Blocker, offen):** `generateListingAction` auf Trigger+Polling (letzter blockierender Flow).

## 12. Weitere umgesetzte Verbesserungen (2026-07-13/14)
- **Batch-Schreiben-Fortschritt** zog den fertigen Zustand nicht nach (zeigte „8/10 · schreibt noch" bei fertigem Buch) → Intervall-Poll während des Laufs + Timeout pro Kapitel-Fetch.
- **Kapitel einklappbar** auf der Schreiben-Seite (fertige starten eingeklappt).
- **Cover-Qualität** zeigt Generierungszeiten statt interner Cent-Kosten.
- **Cover-Titel-Stil** wählbar (Klassisch/Kopf/Hell = Position + Ton), damit der Textbalken nichts Wichtiges überdeckt; inkl. RLS-Grant-Fix für die neue Spalte.
- **Hub:** prominenter „Nächster Schritt"-CTA + Freischalt-Hinweis an der Gliederung für gesperrte Bücher.

Jeder Schnitt ist eigenständig lauffähig und deploybar.

---

## 11. Wo Claude Design helfen sollte
Die **Struktur** (dieses Dokument) klären wir hier. Für die **visuelle Ausgestaltung** lohnt Claude Design, sobald die Struktur steht — konkret:
- **Hub-Cockpit**: Layout von Fortschritt + Stepper + „nächster Schritt" (das ist das neue Herzstück, das es visuell noch nicht gibt).
- **Stepper-Zustände** (erledigt/aktuell/offen/optional) als klares, ruhiges Muster.
- Einheitlicher **Seitenkopf** für alle Spokes.
Passend zur bestehenden Design-Quelle „Buchwerk Studio.dc.html". → Sag Bescheid, dann hole ich mir das Design von dort bzw. spiegle den neuen Hub dorthin.
