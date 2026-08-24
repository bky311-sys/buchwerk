-- Kampagnen-Zuordnung für die Werbe-Auswertung: First-Touch-UTM-Parameter
-- (Quelle/Kampagne/Landingpage) werden bei der Registrierung am Profil
-- festgehalten. Umsatz pro Kampagne = purchases JOIN profiles über user_id.
alter table public.profiles
  add column if not exists acquisition jsonb;
