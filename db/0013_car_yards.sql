-- =====================================================================
-- AutoConnect — Car Yards (dealership storefronts)
-- =====================================================================

create table if not exists public.car_yards (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.sellers(id) on delete cascade,
  slug text not null unique,
  name text not null,
  tagline text,
  description text,
  logo_url text,
  cover_url text,
  country text not null,
  city text,
  address text,
  phone text,
  whatsapp text,
  email text,
  opening_hours text,
  latitude double precision,
  longitude double precision,
  is_approved boolean not null default false,
  is_featured boolean not null default false,
  is_suspended boolean not null default false,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (seller_id)
);
create index if not exists car_yards_slug_idx on public.car_yards(slug);
create index if not exists car_yards_country_idx on public.car_yards(country);

grant select on public.car_yards to anon;
grant select, insert, update on public.car_yards to authenticated;
grant all on public.car_yards to service_role;

alter table public.car_yards enable row level security;

drop policy if exists "yards_public_approved" on public.car_yards;
create policy "yards_public_approved" on public.car_yards
  for select to anon, authenticated
  using (is_approved = true and is_suspended = false);

drop policy if exists "yards_owner_select" on public.car_yards;
create policy "yards_owner_select" on public.car_yards
  for select to authenticated
  using (seller_id in (select id from public.sellers where profile_id = auth.uid()));

drop policy if exists "yards_owner_insert" on public.car_yards;
create policy "yards_owner_insert" on public.car_yards
  for insert to authenticated
  with check (seller_id in (select id from public.sellers where profile_id = auth.uid()));

drop policy if exists "yards_owner_update" on public.car_yards;
create policy "yards_owner_update" on public.car_yards
  for update to authenticated
  using (seller_id in (select id from public.sellers where profile_id = auth.uid()))
  with check (seller_id in (select id from public.sellers where profile_id = auth.uid()));

drop policy if exists "yards_admin_all" on public.car_yards;
create policy "yards_admin_all" on public.car_yards
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- keep approval/suspension admin-only for owners
create or replace function public.car_yards_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.has_role(auth.uid(), 'admin') then
    return new;
  end if;
  new.is_approved := old.is_approved;
  new.is_featured := old.is_featured;
  new.is_suspended := old.is_suspended;
  new.rejection_reason := old.rejection_reason;
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists car_yards_guard_trg on public.car_yards;
create trigger car_yards_guard_trg before update on public.car_yards
  for each row execute function public.car_yards_guard();

-- link listings to a yard
alter table public.cars add column if not exists yard_id uuid references public.car_yards(id) on delete set null;
create index if not exists cars_yard_idx on public.cars(yard_id);

