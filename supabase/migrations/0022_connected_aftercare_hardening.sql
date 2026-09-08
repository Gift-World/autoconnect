-- Connected aftercare: safe garage access, service bookings and vehicle-linked enquiries.
-- This migration intentionally removes the fixed demo-owner write policies from 0020.

begin;

alter table public.garage_vehicles enable row level security;
drop policy if exists "Users can view their own garage vehicles" on public.garage_vehicles;
drop policy if exists "Users can insert their own garage vehicles" on public.garage_vehicles;
drop policy if exists "Users can update their own garage vehicles" on public.garage_vehicles;
drop policy if exists "Users can delete their own garage vehicles" on public.garage_vehicles;
drop policy if exists "garage_vehicles_owner_all" on public.garage_vehicles;
create policy "garage_vehicles_owner_all" on public.garage_vehicles
  for all to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- A quote request can be attached to the customer's vehicle, so it can later
-- appear in My Garage without exposing either party's data to other users.
alter table public.part_inquiries add column if not exists garage_vehicle_id uuid
  references public.garage_vehicles(id) on delete set null;
create index if not exists part_inquiries_garage_vehicle_idx
  on public.part_inquiries(garage_vehicle_id, created_at desc);

create table if not exists public.service_bookings (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  provider_id uuid not null references public.service_providers(id) on delete restrict,
  garage_vehicle_id uuid references public.garage_vehicles(id) on delete set null,
  service_type text not null,
  requested_for timestamptz,
  customer_notes text not null default '' check (char_length(customer_notes) <= 2000),
  provider_notes text,
  quoted_amount numeric check (quoted_amount >= 0),
  currency text not null default 'KES',
  status text not null default 'requested' check (status in ('requested','quoted','approved','confirmed','in_progress','completed','cancelled')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists service_bookings_customer_idx on public.service_bookings(customer_id, created_at desc);
create index if not exists service_bookings_provider_idx on public.service_bookings(provider_id, created_at desc);
grant select, insert, update on public.service_bookings to authenticated;
grant all on public.service_bookings to service_role;
alter table public.service_bookings enable row level security;
create policy "service_bookings_customer_select" on public.service_bookings for select to authenticated
  using (customer_id = auth.uid());
create policy "service_bookings_customer_insert" on public.service_bookings for insert to authenticated
  with check (customer_id = auth.uid() and (garage_vehicle_id is null or exists (
    select 1 from public.garage_vehicles where id = garage_vehicle_id and owner_id = auth.uid()
  )));
create policy "service_bookings_customer_update" on public.service_bookings for update to authenticated
  using (customer_id = auth.uid() and status in ('requested','quoted'))
  with check (customer_id = auth.uid());
create policy "service_bookings_provider_select" on public.service_bookings for select to authenticated
  using (provider_id in (select id from public.service_providers where owner_id = auth.uid()));
create policy "service_bookings_provider_update" on public.service_bookings for update to authenticated
  using (provider_id in (select id from public.service_providers where owner_id = auth.uid()))
  with check (provider_id in (select id from public.service_providers where owner_id = auth.uid()));
create policy "service_bookings_admin_all" on public.service_bookings for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
drop trigger if exists service_bookings_set_updated_at on public.service_bookings;
create trigger service_bookings_set_updated_at before update on public.service_bookings
  for each row execute function public.set_updated_at();

commit;
