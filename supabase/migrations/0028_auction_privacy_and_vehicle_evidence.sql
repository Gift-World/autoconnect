-- Keep auction bidders private. The public feed deliberately returns only a
-- stable pseudonym, bid amount, and time; raw bidder account IDs stay private.
drop policy if exists "public read bid amounts" on public.auction_bids;

create policy "bidders can read their own bids"
  on public.auction_bids for select to authenticated
  using (bidder_id = auth.uid());

create policy "auction sellers can read their auction bids"
  on public.auction_bids for select to authenticated
  using (
    exists (
      select 1
      from public.vehicle_auctions auction
      join public.sellers seller on seller.id = auction.seller_id
      where auction.id = auction_bids.auction_id
        and seller.profile_id = auth.uid()
    )
  );

create or replace function public.get_public_auction_bids(p_auction_id uuid)
returns table(amount numeric, created_at timestamptz, bidder_alias text)
language sql
stable
security definer
set search_path = public
as $$
  select
    bid.amount,
    bid.created_at,
    'Bidder ' || upper(substring(md5(bid.bidder_id::text || bid.auction_id::text), 1, 5))
  from public.auction_bids bid
  where bid.auction_id = p_auction_id
  order by bid.created_at desc
  limit 50;
$$;

revoke all on function public.get_public_auction_bids(uuid) from public;
grant execute on function public.get_public_auction_bids(uuid) to anon, authenticated;

-- Evidence starts as private and unverified. Nothing is represented publicly
-- as a history, ownership, inspection, or mileage result until a reviewer
-- verifies it and deliberately marks it public.
create table if not exists public.vehicle_evidence (
  id uuid primary key default gen_random_uuid(),
  car_id uuid not null references public.cars(id) on delete cascade,
  submitted_by uuid not null references auth.users(id),
  evidence_type text not null check (evidence_type in (
    'inspection_report', 'ownership_document', 'service_record',
    'mileage_record', 'recall_notice', 'history_report', 'other'
  )),
  title text not null,
  source_url text,
  storage_path text,
  status text not null default 'submitted' check (status in ('submitted', 'verified', 'rejected')),
  is_public boolean not null default false,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now()
);

alter table public.vehicle_evidence enable row level security;

create policy "public can read verified public vehicle evidence"
  on public.vehicle_evidence for select
  using (status = 'verified' and is_public = true);

create policy "submitters can read their vehicle evidence"
  on public.vehicle_evidence for select to authenticated
  using (submitted_by = auth.uid());

create policy "sellers can submit evidence for their own cars"
  on public.vehicle_evidence for insert to authenticated
  with check (
    submitted_by = auth.uid()
    and exists (
      select 1 from public.cars car
      join public.sellers seller on seller.id = car.seller_id
      where car.id = vehicle_evidence.car_id
        and seller.profile_id = auth.uid()
    )
  );

create policy "admins can manage vehicle evidence"
  on public.vehicle_evidence for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));
