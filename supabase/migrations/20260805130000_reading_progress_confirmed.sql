-- Migration: Leser bestätigt ein Kapitel aktiv, statt dass wir es still zählen
-- Created:   2026-08-05
-- Purpose:   Produktentscheidung mit Benjamin (05.08.): die Geschwindigkeits-
--            messung soll ein niedriger technischer Boden bleiben (Missbrauch
--            unattraktiver machen, Anhang Nr. 23b UWG), aber die eigentliche
--            "das zählt als gelesen"-Aussage soll der Leser selbst per Klick
--            treffen — nicht Buchwerk im Hintergrund. Siehe Log in CLAUDE.md.

alter table public.reading_progress
  add column if not exists confirmed_at timestamptz;

-- Kein neues Grant nötig: reading_progress hat für authenticated ohnehin nur
-- eine SELECT-Policy (siehe 20260715140000). Geschrieben wird confirmed_at wie
-- max_scroll/seconds_active ausschließlich über den Service-Role-Client in
-- /api/lesen/confirm, nachdem der Server die Schwelle selbst nachgeprüft hat.
