-- Migration: add plan to public.profiles
-- Created:   2026-06-13
-- Purpose:   Account tier for the admin overview. 'free' by default; set to
--            'paid' manually (admin) for now, automatically once billing
--            (Stripe) is integrated.

alter table public.profiles
  add column if not exists plan text not null default 'free';
