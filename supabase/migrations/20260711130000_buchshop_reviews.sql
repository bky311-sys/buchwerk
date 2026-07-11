-- Migration: Buchshop Phase 2 — Bewertungen + internes Punktekonto (Modell A)
-- Created:   2026-07-11
-- Purpose:   Leser bewerten veröffentlichte Buchshop-Bücher auf buchwerk.
--            Punkte sind ein rein internes Instrument (kein Geldwert, keine
--            Auszahlung), werden erst nach Autor-Freigabe gutgeschrieben und
--            hängen NICHT von der Sternebewertung ab. Details: docs/BUCHSHOP.md.
--
-- Lese-/Moderationspfad: öffentliche Anzeige freigegebener Bewertungen und die
-- Autor-Moderation laufen serverseitig über den service-role Client. Deshalb
-- brauchen die Policies unten nur den Eigentümer-Schutz (Rezensent sieht/erstellt
-- eigene Zeilen); es werden KEINE anon-Policies geöffnet.

-- == shop_acquisitions: "ich lese dieses Buch" — startet die 2h-Lesesperre ==
create table if not exists public.shop_acquisitions (
  id          uuid        primary key default gen_random_uuid(),
  book_id     uuid        not null references public.projects (id) on delete cascade,
  user_id     uuid        not null references auth.users (id) on delete cascade,
  kind        text        not null default 'kauf',  -- 'pdf' | 'kindle' | 'kauf'
  acquired_at timestamptz not null default now(),
  unique (book_id, user_id)
);
create index if not exists shop_acquisitions_user_idx
  on public.shop_acquisitions (user_id, book_id);

alter table public.shop_acquisitions enable row level security;
create policy "acquisitions_select_own" on public.shop_acquisitions
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "acquisitions_insert_own" on public.shop_acquisitions
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "acquisitions_delete_own" on public.shop_acquisitions
  for delete to authenticated using ((select auth.uid()) = user_id);

-- == shop_reviews: buchwerk-interne Bewertung eines Buchs ==
create table if not exists public.shop_reviews (
  id          uuid        primary key default gen_random_uuid(),
  book_id     uuid        not null references public.projects (id) on delete cascade,
  user_id     uuid        not null references auth.users (id) on delete cascade,
  rating      int         not null check (rating between 1 and 5),
  body        text,
  status      text        not null default 'pending', -- 'pending' | 'approved' | 'rejected'
  rewarded    boolean     not null default false,      -- Punkte bereits gutgeschrieben?
  created_at  timestamptz not null default now(),
  approved_at timestamptz,
  unique (book_id, user_id)                            -- eine Bewertung pro Buch/Nutzer
);
create index if not exists shop_reviews_book_idx
  on public.shop_reviews (book_id, status, created_at desc);

alter table public.shop_reviews enable row level security;
-- Rezensent sieht die eigenen Bewertungen (inkl. pending). Öffentliche Anzeige
-- und Autor-Moderation laufen über service-role.
create policy "reviews_select_own" on public.shop_reviews
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "reviews_insert_own" on public.shop_reviews
  for insert to authenticated with check ((select auth.uid()) = user_id);

-- == point_ledger: internes Punktekonto (KEIN Geldwert, keine Auszahlung) ==
create table if not exists public.point_ledger (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users (id) on delete cascade,
  delta      int         not null,                     -- +verdient / -eingelöst
  reason     text        not null,                     -- z.B. 'review_approved'
  review_id  uuid        references public.shop_reviews (id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists point_ledger_user_idx
  on public.point_ledger (user_id, created_at desc);

alter table public.point_ledger enable row level security;
-- Nur Lesen der eigenen Buchungen. Einträge entstehen ausschließlich über
-- service-role (Autor-Freigabe), daher keine insert/update/delete-Policy.
create policy "point_ledger_select_own" on public.point_ledger
  for select to authenticated using ((select auth.uid()) = user_id);

comment on table public.shop_acquisitions is
  'Erwerbsvermerk je Buch/Nutzer; acquired_at startet die 2h-Lesesperre.';
comment on table public.shop_reviews is
  'Buchwerk-interne Bewertungen; Autor-Moderation via service-role.';
comment on table public.point_ledger is
  'Internes Punktekonto (Modell A). Kein Geldwert, keine Auszahlung.';
