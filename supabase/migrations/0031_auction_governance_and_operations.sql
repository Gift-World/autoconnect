-- Auction governance: sellers submit; an administrator approves before public release.
alter table public.vehicle_auctions
  add column if not exists approval_status text not null default 'pending' check (approval_status in ('pending', 'approved', 'rejected')),
  add column if not exists approval_note text,
  add column if not exists reviewed_by uuid references auth.users(id),
  add column if not exists reviewed_at timestamptz,
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancelled_by uuid references auth.users(id),
  add column if not exists cancellation_reason text;

drop policy if exists "public read live auctions" on public.vehicle_auctions;
drop policy if exists "sellers can manage their auctions" on public.vehicle_auctions;
drop policy if exists "sellers can create auctions for their approved cars" on public.vehicle_auctions;

create policy "sellers can submit auctions for their approved cars"
  on public.vehicle_auctions for insert to authenticated
  with check (
    approval_status = 'pending'
    and exists (
      select 1 from public.sellers seller
      join public.cars car on car.seller_id = seller.id
      where seller.id = vehicle_auctions.seller_id
        and car.id = vehicle_auctions.car_id
        and car.status = 'approved'
        and seller.profile_id = auth.uid()
    )
  );

create policy "public can read approved auctions"
  on public.vehicle_auctions for select
  using (approval_status = 'approved');

create policy "sellers can read their auctions"
  on public.vehicle_auctions for select to authenticated
  using (exists (select 1 from public.sellers seller where seller.id = vehicle_auctions.seller_id and seller.profile_id = auth.uid()));

create policy "sellers can edit unapproved auctions"
  on public.vehicle_auctions for update to authenticated
  using (approval_status in ('pending', 'rejected') and exists (select 1 from public.sellers seller where seller.id = vehicle_auctions.seller_id and seller.profile_id = auth.uid()))
  with check (approval_status in ('pending', 'rejected') and exists (select 1 from public.sellers seller where seller.id = vehicle_auctions.seller_id and seller.profile_id = auth.uid()));

create policy "admins can manage auctions"
  on public.vehicle_auctions for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.admin_audit_log enable row level security;
create policy "admins can read audit logs" on public.admin_audit_log for select to authenticated using (public.has_role(auth.uid(), 'admin'));

create or replace function public.log_auction_governance()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.approval_status is distinct from new.approval_status
     or old.status is distinct from new.status
     or old.cancellation_reason is distinct from new.cancellation_reason then
    insert into public.admin_audit_log(actor_id, action, entity_type, entity_id, detail)
    values (auth.uid(), 'auction_updated', 'vehicle_auction', new.id,
      jsonb_build_object('approval_status', new.approval_status, 'status', new.status, 'reason', new.cancellation_reason));
  end if;
  return new;
end;
$$;
drop trigger if exists auction_governance_audit on public.vehicle_auctions;
create trigger auction_governance_audit after update on public.vehicle_auctions for each row execute function public.log_auction_governance();

create or replace function public.notify_auction_reservation()
returns trigger language plpgsql security definer set search_path = public as $$
declare seller_user uuid; title text;
begin
  select seller.profile_id, car.title into seller_user, title
  from public.vehicle_auctions auction
  join public.sellers seller on seller.id = auction.seller_id
  join public.cars car on car.id = auction.car_id
  where auction.id = new.auction_id;
  insert into public.notifications(user_id,type,title,body,link)
  values
    (new.buyer_id, 'auction_reservation', 'Auction reservation created', 'Your reservation is payment pending until payment evidence is verified.', '/account/purchases'),
    (seller_user, 'auction_reservation', 'Winning bidder reserved your auction', coalesce(title, 'Vehicle') || ' is reserved pending verified payment.', '/seller/auctions');
  return new;
end;
$$;
drop trigger if exists auction_reservation_notify on public.auction_reservations;
create trigger auction_reservation_notify after insert on public.auction_reservations for each row execute function public.notify_auction_reservation();

create or replace function public.expire_due_auction_reservations()
returns integer language plpgsql security definer set search_path = public as $$
declare changed integer;
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'Admin access required'; end if;
  update public.auction_reservations set status = 'expired'
  where status in ('reservation_pending', 'payment_pending') and expires_at <= now();
  get diagnostics changed = row_count;
  return changed;
end;
$$;
grant execute on function public.expire_due_auction_reservations() to authenticated;

create table if not exists public.product_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  event_name text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.product_events enable row level security;
create policy "users can record their own product events" on public.product_events for insert to authenticated with check (user_id = auth.uid());
create policy "admins can read product events" on public.product_events for select to authenticated using (public.has_role(auth.uid(), 'admin'));
