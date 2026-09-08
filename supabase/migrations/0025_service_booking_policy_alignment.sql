-- Keep future environments aligned with the live service-booking security rules.
-- Providers must be owned by a real authenticated account before they can
-- view or update their booking inbox.

begin;

alter table public.service_providers
  add column if not exists owner_id uuid references auth.users(id) on delete set null;

drop policy if exists "service_bookings_customer_update" on public.service_bookings;
create policy "service_bookings_customer_update" on public.service_bookings
  for update to authenticated
  using (customer_id = auth.uid() and status in ('requested', 'quoted'))
  with check (customer_id = auth.uid() and status in ('approved', 'cancelled'));

commit;
