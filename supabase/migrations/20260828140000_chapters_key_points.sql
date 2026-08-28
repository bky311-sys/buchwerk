-- Anti-Wiederholung an der Wurzel (28.08.): Jedes Kapitel liefert beim
-- Schreiben 3-5 Kernaussagen mit (kein Extra-Modell-Call, nur ein zusätzlicher
-- Block in der Antwort). Die folgenden Kapitel bekommen sie als Kontext — sie
-- sahen bisher nur Zwischenüberschriften und konnten deshalb nicht erkennen,
-- dass sie ein Konzept zum dritten Mal erklären.
alter table public.chapters
  add column if not exists key_points jsonb not null default '[]'::jsonb;

grant select (key_points), update (key_points) on public.chapters to authenticated;
