-- 0010 — Inspection MVP: checklist jsonb + buyer-safe summary + photos
begin;

alter table public.inspections
  add column if not exists checklist jsonb not null default '{}'::jsonb,
  add column if not exists buyer_summary text,
  add column if not exists photos_urls text[] not null default '{}',
  add column if not exists requested_by uuid references public.profiles(id),
  add column if not exists requested_at timestamptz not null default now();

create index if not exists inspections_car_status_idx
  on public.inspections(car_id, status);

-- Allow sellers to request an inspection on their own listing.
drop policy if exists insp_seller_insert on public.inspections;
create policy insp_seller_insert on public.inspections
  for insert to authenticated
  with check (
    seller_id in (select id from public.sellers where profile_id = auth.uid())
  );

commit;
