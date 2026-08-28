-- Punkte als Produktionswährung (Freigabe 28.08.): Das Ledger bekommt einen
-- Projektbezug, damit nachvollziehbar bleibt, wofür Punkte ausgegeben wurden.
alter table public.point_ledger
  add column if not exists project_id uuid references public.projects(id) on delete set null;

-- Nur lesen darf der Nutzer selbst; geschrieben wird ausschließlich über den
-- Service-Role-Client (Punktestand darf nie clientseitig manipulierbar sein).
grant select (project_id) on public.point_ledger to authenticated;

create index if not exists point_ledger_user_created_idx
  on public.point_ledger (user_id, created_at desc);
