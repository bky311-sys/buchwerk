# UX-Review — Buchwerk

**Stand:** 2026-07-14 · Review des gesamten Nutzer-Flows (Landing → Anlegen → Hub → Schreiben → Cover → Listing → Veröffentlichen).

---

## UMSETZUNGSSTAND 2026-08-01 (zweiter Live-Durchlauf + Sammel-Umsetzung)

Zweiter kompletter Durchlauf als Testnutzer am 01.08., zwei neue P1-Funde, danach
alles in einem Schwung umgesetzt:

**Neu gefunden und gefixt:**
- **Rohes Markdown in der Autorenansicht** — ausgeklappte Kapitel auf /schreiben
  zeigten `##`/`###` als Text. Jetzt rendert dort `ChapterProse` (wie im Reader);
  der Markdown-Text bleibt im Bearbeiten-Modus, mit Hinweiszeile, was die Zeichen
  bedeuten. `---` schluckt der Renderer jetzt überall (leakte im Reader als Text).
- **Fertige Kapitel im Hub hatten nur „Neu schreiben"** als Aktion — Lesen ging
  dort gar nicht. Jetzt: „Kapitel lesen & bearbeiten" als Primärbutton
  (Deep-Link `/schreiben#kap-<id>`, Karte klappt auf und scrollt hin), Neu
  schreiben als Outline-Button daneben (Bestätigungsdialog existierte schon).

**Alte Punkte, jetzt umgesetzt:** #1 Projektkarten (Fortschrittsbalken, X/Y
Kapitel, aktueller Schritt, „Weiter"-Button; Löschen nicht mehr einzige Aktion) ·
#2 Stepper auf allen vier Spoke-Seiten (kompakt, „Du bist hier"-Markierung;
Logik geteilt in `lib/books/workflow.ts`) · #3 KDP-Listing auf Trigger+Poll
(API-Route `/api/projekte/[id]/listing`, Poll + 90-s-Notbremse — letzter
blockierender Flow) · #6-Rest: die 15 Amazon-Schritte sind einklappbar und
**abhakbar** (localStorage pro Projekt) · Hub-Doppel-CTA („Nächster
Schritt"-Box + Stepper mit identischem Button) zu einer Karte zusammengelegt ·
Cover: Auto-Vorschlag beim ersten Besuch statt leerem „Englischer
Bildprompt"-Feld, Jargon raus („Bildidee", kein „Flux"/„Prompt" mehr im UI).

**Bewusst NICHT umgesetzt:** #13 (Gliederung vor Registrierung) — öffnet einen
unlimitierten KI-Endpunkt für anonyme Nutzer; braucht erst eine
Missbrauchs-/Kosten-Entscheidung (Rate-Limit o. Ä.). Bleibt der stärkste
Conversion-Hebel.

Grundlage: der Ist-Zustand nach dem Hub-and-Spoke-Umbau. Der Kern-Flow trägt jetzt gut — dieses Review zielt darauf, ihn **verständlicher, schneller und klickbarer** zu machen. Sortiert nach Wirkung/Aufwand.

---

## Gesamteindruck
Der geführte Ablauf (Cockpit + fokussierte Schritte + „Nächster Schritt"-CTA) ist eine große Verbesserung. Die verbleibende Reibung liegt an drei Stellen: **Orientierung** („Wo bin ich, was kommt?"), **Wartezeiten/Zustände**, und **Wiedereinstieg** (mehrere Bücher verwalten).

---

## P1 — Höchste Wirkung

### 1. Projektkarten zeigen keinen Fortschritt
`/projekte` listet alle Bücher nur mit Titel, Thema und „In Arbeit". Bei 4 Büchern sieht man **nicht**, welches fast fertig ist und was als Nächstes dran wäre.
**→** Pro Karte: Fortschritt (z. B. „8/10 Kapitel"), aktueller Schritt (Schreiben/Cover/Listing/Veröffentlichen) und ein direkter **„Weiter"-Button** zur nächsten Aktion. Macht den Wiedereinstieg mit einem Klick möglich.

### 2. Stepper fehlt auf den Spoke-Seiten
Auf Schreiben/Cover/Listing/Veröffentlichen gibt es „← zurück" + einen Weiter-CTA, aber **nicht den Gesamt-Stepper**. Man verliert das Gefühl, wo im Ablauf man steht.
**→** Den kompakten Stepper (Schreiben · Cover · Listing · Veröffentlichen, mit Erledigt/Aktuell-Status) auf **jede** Spoke setzen. Konsistente Orientierung, freies Springen.

### 3. KDP-Listing-Generierung blockiert noch (~20 s)
Alle anderen langen Aktionen laufen entkoppelt mit Spinner + Poll — das Listing ist der letzte blockierende Flow. Bei Verbindungsabbruch oder Ungeduld wirkt es hängend.
**→** Auf Trigger+Polling umstellen wie Kapitel/Cover (Spinner + „wird erstellt", Ergebnis per Poll). Letzter offener Punkt aus der Architektur.

---

## P2 — Deutliche Verbesserung

### 4. Gesperrter Hub versteckt die Roadmap
Vor dem Freischalten sieht man die Freischalt-Karte + Gliederung, aber **nicht den Stepper** — man kauft, ohne den ganzen Weg zu sehen.
**→** Den Stepper auch im gesperrten Zustand zeigen (ausgegraut/als Vorschau). Der Käufer sieht, was er bekommt.

### 5. Batch-Schreiben macht Angst
Der Bestätigungsdialog sagt „dauert Minuten — lass den Tab offen". Seit dem Poll-Fix überlebt der Zustand aber Reloads.
**→** Umformulieren: „Läuft im Hintergrund weiter — du kannst die Seite verlassen und später zurückkommen." Nimmt die Unsicherheit.

### 6. „Veröffentlichen" ist eine lange Wand
Impressum + Downloads + Amazon-Anleitung + Buchshop gestapelt.
**→** Reihenfolge nach Nutzer-Bedarf: **Downloads zuerst**, dann Impressum (wenn nötig), die lange Amazon-Anleitung **einklappbar** („Anleitung anzeigen"), Shop unten. Weniger Scrollen, klarer Fokus.

### 7. Impressum-Gate wirkt wie ein Fehler
Wer vor ausgefülltem Impressum auf Download klickt, bekommt eine Fehlermeldung.
**→** Den Download-Button vorher **deaktiviert** zeigen mit Inline-Hinweis „Fülle zuerst das Impressum aus" + Sprung dorthin — statt Klick-dann-Fehler.

---

## P3 — Quick Wins (intuitive Klicks, kleine Politur)

### 8. Gliederungs-Kapitel → direkt zum Schreiben springen
Klick auf ein Kapitel im Hub führt aktuell nur zum Inline-Editor.
**→** Ein Kapitel im Hub anklickbar machen, das direkt zur Schreiben-Seite bei genau diesem Kapitel springt (Deep-Link/Anker).

### 9. Fortschrittsbalken/Stepper klickbar
Der Balken auf dem Hub ist rein visuell.
**→** Stepper-Schritte sind bereits Links; den „nächster Schritt"-Balken ebenfalls klickbar zur aktuellen Aktion machen.

### 10. Namens-Konsistenz
Mal „KDP-Texte", mal „KDP-Listing" (Chip vs. Seite).
**→** Einheitlich benennen (Vorschlag: durchgängig „KDP-Listing").

### 11. Titel-Bearbeitung sichtbarer
`EditableTitle` gibt es, aber die Bearbeitbarkeit ist nicht offensichtlich.
**→** Ein dezentes Stift-Icon am Titel als Affordance.

### 12. Erstnutzer-Nudge nach dem ersten Projekt
Die 3-Schritt-Erklärung steht nur auf der Projektliste.
**→** Beim allerersten Projekt im Hub ein einmaliger, schließbarer Hinweis „So geht's weiter: erst Gliederung prüfen, dann freischalten & schreiben."

---

## Strategisch (größer, hohe Wirkung auf Conversion)

### 13. Wert zeigen, bevor man sich registriert
Die Landing verspricht „kostenlos Gliederung", aber man muss sich **erst registrieren**, bevor man irgendetwas sieht.
**→** Perspektivisch: Thema eingeben → Gliederung **sofort** zeigen (ohne Login), Registrierung erst beim Speichern/Schreiben. Senkt die Einstiegshürde deutlich — aber größerer Umbau (anonyme Sessions).

---

## Antwort auf die drei Fragen
- **Was vereinfacht das Erlebnis?** Fortschritt + „Weiter" auf den Projektkarten (#1), Listing entblocken (#3), „Veröffentlichen" entzerren (#6).
- **Was macht den Workflow verständlicher?** Stepper überall (#2), Roadmap auch im gesperrten Zustand (#4), Erstnutzer-Nudge (#12).
- **Wo sind intuitive Klicks sinnvoll?** Kapitel → Schreiben-Deep-Link (#8), klickbarer Fortschritt (#9), Download-Gate statt Fehler (#7), Karten-„Weiter"-Button (#1).

## Vorschlag zur Reihenfolge
1. **Projektkarten mit Fortschritt + Weiter-CTA** (#1) — größter Alltagsnutzen.
2. **Stepper auf allen Spokes** (#2) + **Roadmap im gesperrten Hub** (#4).
3. **KDP-Listing auf Polling** (#3).
4. **Veröffentlichen entzerren** (#6) + **Download-Gate** (#7) + **Batch-Text** (#5).
5. Quick Wins (#8–#12) gebündelt.
