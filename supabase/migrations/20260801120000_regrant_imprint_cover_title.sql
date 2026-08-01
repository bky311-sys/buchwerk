-- Migration: re-grant column UPDATE rights lost to the hardening revoke
-- Created:   2026-08-01 (manuell in Prod eingespielt am 01.08., hier zur Doku
--            und für frische Umgebungen)
--
-- Warum: 20260712130000_security_hardening macht `revoke update on projects` und
-- grantet dann eine Spalten-Allowlist. Ein REVOKE löscht aber ALLE Spalten-Grants
-- — auch die aus Migrationen mit späterem Zeitstempel, wenn die Härtung außer der
-- Reihe (erneut) eingespielt wird. Genau das ist in Prod passiert: die Grants aus
-- 20260712140000 (imprint_*) und 20260714120000 (cover_title_style) fehlten,
-- „Impressum speichern" scheiterte mit 42501 bei grünem Build.
--
-- Regel ab jetzt: Wer die Härtung erneut einspielt, muss diese Datei danach
-- ebenfalls einspielen (oder: Grants nie isoliert re-revoken).

grant update (imprint_name, imprint_street, imprint_zip, imprint_city)
  on public.projects to authenticated;

grant update (cover_title_style)
  on public.projects to authenticated;
