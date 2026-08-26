-- Live-Fortschritt des Abschnitts-Modus ("Abschnitt 2/3") für das
-- Schreib-Cockpit. NULL = kein Lauf bzw. Einzel-Call-Modus.
alter table public.chapters
  add column if not exists generation_step text;
