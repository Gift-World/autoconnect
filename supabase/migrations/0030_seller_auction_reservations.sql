-- Sellers may only run auctions against their own approved listings.
create policy "sellers can create auctions for their approved cars"
  on public.vehicle_auctions for insert to authenticated
  with check (
    exists (
      select 1 from public.sellers seller
      join public.cars car on car.seller_id = seller.id
      where seller.id = vehicle_auctions.seller_id
        and car.id = vehicle_auctions.car_id
        and car.status = 'approved'
        and seller.profile_id = auth.uid()
    )
  );

create policy "sellers can manage their auctions"
  on public.vehicle_auctions for update to authenticated
  using (exists (select 1 from public.sellers seller where seller.id = vehicle_auctions.seller_id and seller.profile_id = auth.uid()))
  with check (exists (select 1 from public.sellers seller where seller.id = vehicle_auctions.seller_id and seller.profile_id = auth.uid()));

create table if not exists public.auction_reservations (
  id uuid primary key default gen_random_uuid(),
  auction_id uuid not null unique references public.vehicle_auctions(id) on delete cascade,
  buyer_id uuid not null references auth.users(id),
  status text not null default 'reservation_pending' check (status in ('reservation_pending', 'payment_pending', 'payment_verified', 'expired', 'cancelled')),
  amount numeric not null check (amount >= 0),
  expires_at timestamptz not null default now() + interval '24 hours',
  created_at timestamptz not null default now()
);

alter table public.auction_reservations enable row level security;

create policy "buyers can read their auction reservations"
  on public.auction_reservations for select to authenticated
  using (buyer_id = auth.uid());

create policy "sellers can read their auction reservations"
  on public.auction_reservations for select to authenticated
  using (exists (select 1 from public.vehicle_auctions auction join public.sellers seller on seller.id = auction.seller_id where auction.id = auction_reservations.auction_id and seller.profile_id = auth.uid()));

create policy "admins can manage auction reservations"
  on public.auction_reservations for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create or replace function public.claim_auction_win(p_auction_id uuid)
returns public.auction_reservations
language plpgsql
security definer
set search_path = public
as $$
declare auction public.vehicle_auctions%rowtype; reservation public.auction_reservations%rowtype;
begin
  select * into auction from public.vehicle_auctions where id = p_auction_id for update;
  if auction.id is null or auction.winner_id <> auth.uid() or now() < auction.ends_at then
    raise exception 'This auction cannot be reserved by this account';
  end if;
  if auction.status not in ('live', 'ended', 'reserved') then
    raise exception 'This auction is not ready for reservation';
  end if;
  insert into public.auction_reservations (auction_id, buyer_id, amount)
  values (auction.id, auth.uid(), coalesce(auction.current_bid, auction.reserve_price))
  on conflict (auction_id) do nothing
  returning * into reservation;
  if reservation.id is null then
    select * into reservation from public.auction_reservations where auction_id = auction.id;
  end if;
  if reservation.buyer_id <> auth.uid() then
    raise exception 'This auction has already been reserved';
  end if;
  update public.vehicle_auctions set status = 'reserved' where id = auction.id;
  return reservation;
end;
$$;

grant execute on function public.claim_auction_win(uuid) to authenticated;
