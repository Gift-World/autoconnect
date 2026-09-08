-- Service completion evidence and customer reviews. Both are scoped through
-- the booking so neither a provider nor a customer can review another booking.
begin;

alter table public.service_bookings
  add column if not exists receipt_number text unique,
  add column if not exists completed_notes text;

create table if not exists public.service_reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.service_bookings(id) on delete cascade,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  provider_id uuid not null references public.service_providers(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text check (char_length(comment) <= 1000),
  created_at timestamptz not null default now()
);
grant select, insert on public.service_reviews to authenticated;
grant all on public.service_reviews to service_role;
alter table public.service_reviews enable row level security;
create policy "service_reviews_public_read" on public.service_reviews for select to authenticated using (true);
create policy "service_reviews_customer_insert" on public.service_reviews for insert to authenticated
  with check (customer_id = auth.uid() and exists (
    select 1 from public.service_bookings b where b.id = booking_id and b.customer_id = auth.uid() and b.provider_id = provider_id and b.status = 'completed'
  ));

commit;
