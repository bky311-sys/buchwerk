-- Migration: Erstattungen nachvollziehbar machen
-- Created:   2026-08-04
--
-- Der Stripe-Webhook verarbeitet jetzt charge.refunded: Bei einer vollständigen
-- Erstattung eines Buchkaufs wird die Freischaltung (book_unlocks) entfernt und
-- der Kauf hier markiert statt gelöscht — so bleibt der Vorgang im Admin-Bereich
-- und in der Datenbank nachvollziehbar. Der Admin-Zähler "Buch-Käufe" zählt nur
-- noch Käufe ohne refunded_at.

alter table public.purchases
  add column if not exists refunded_at timestamptz;
