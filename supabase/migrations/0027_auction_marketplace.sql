-- Timed auctions and flash-sale inventory. Bids are accepted only through
-- submit_auction_bid so price, timing and bidder anonymity are enforced in Postgres.
create table if not exists public.vehicle_auctions (
  id uuid primary key default gen_random_uuid(),
  car_id uuid not null unique references public.cars(id) on delete cascade,
  seller_id uuid not null references public.sellers(id),
  sale_mode text not null check (sale_mode in ('timed_auction','flash_sale')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reserve_price numeric not null check (reserve_price >= 0),
  minimum_increment numeric not null default 1000 check (minimum_increment > 0),
  current_bid numeric,
  bid_count integer not null default 0,
  status text not null default 'scheduled' check (status in ('scheduled','live','ended','reserved','cancelled')),
  winner_id uuid references auth.users(id),
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);
create table if not exists public.auction_bids (
  id uuid primary key default gen_random_uuid(),
  auction_id uuid not null references public.vehicle_auctions(id) on delete cascade,
  bidder_id uuid not null references auth.users(id),
  amount numeric not null check (amount > 0),
  created_at timestamptz not null default now(),
  unique(auction_id, bidder_id, amount)
);
alter table public.vehicle_auctions enable row level security;
alter table public.auction_bids enable row level security;
create policy "public read live auctions" on public.vehicle_auctions for select using (true);
create policy "public read bid amounts" on public.auction_bids for select using (true);
create or replace function public.submit_auction_bid(p_auction_id uuid, p_amount numeric)
returns public.auction_bids language plpgsql security definer set search_path = public as $$
declare a public.vehicle_auctions%rowtype; b public.auction_bids%rowtype;
begin
  select * into a from vehicle_auctions where id=p_auction_id for update;
  if a.id is null or now() < a.starts_at or now() >= a.ends_at or a.status not in ('scheduled','live') then raise exception 'This auction is not accepting bids'; end if;
  if p_amount < coalesce(a.current_bid + a.minimum_increment, a.reserve_price) then raise exception 'Bid does not meet the current minimum'; end if;
  insert into auction_bids(auction_id,bidder_id,amount) values(p_auction_id,auth.uid(),p_amount) returning * into b;
  update vehicle_auctions set current_bid=p_amount,bid_count=bid_count+1,status='live',winner_id=auth.uid(),ends_at=case when ends_at-now() < interval '2 minutes' then ends_at + interval '2 minutes' else ends_at end where id=p_auction_id;
  return b;
end $$;
grant execute on function public.submit_auction_bid(uuid,numeric) to authenticated;
