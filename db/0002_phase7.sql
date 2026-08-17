-- =====================================================================
-- AutoConnect — Phase 7: notifications, messaging, broadcasts, lifecycle
-- =====================================================================

-- ---------- notifications ----------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,            -- 'inquiry_new','listing_approved','listing_rejected','seller_approved','seller_rejected','import_status','message_new','broadcast','system'
  title text not null,
  body text,
  link text,                     -- in-app path e.g. /seller/inquiries/<id>
  metadata jsonb not null default '{}'::jsonb,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx
  on public.notifications(user_id, is_read, created_at desc);
grant select, update on public.notifications to authenticated;
grant all on public.notifications to service_role;
alter table public.notifications enable row level security;
drop policy if exists "notifications_own_select" on public.notifications;
create policy "notifications_own_select" on public.notifications
  for select to authenticated using (user_id = auth.uid());
drop policy if exists "notifications_own_update" on public.notifications;
create policy "notifications_own_update" on public.notifications
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "notifications_auth_insert" on public.notifications;
create policy "notifications_auth_insert" on public.notifications
  for insert to authenticated with check (true);  -- triggers + cross-user inserts (seller -> buyer) allowed; controlled by app + RLS on source rows
drop policy if exists "notifications_admin_all" on public.notifications;
create policy "notifications_admin_all" on public.notifications
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ---------- inquiry_messages (two-way thread) ----------
create table if not exists public.inquiry_messages (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references public.inquiries(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  sender_role text not null check (sender_role in ('buyer','seller','admin')),
  body text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists inquiry_messages_inquiry_idx
  on public.inquiry_messages(inquiry_id, created_at);
grant select, insert, update on public.inquiry_messages to authenticated;
grant all on public.inquiry_messages to service_role;
alter table public.inquiry_messages enable row level security;

drop policy if exists "inquiry_messages_participant_select" on public.inquiry_messages;
create policy "inquiry_messages_participant_select" on public.inquiry_messages
  for select to authenticated using (
    exists (
      select 1 from public.inquiries i
      left join public.sellers s on s.id = i.seller_id
      where i.id = inquiry_id
        and (i.buyer_id = auth.uid() or s.profile_id = auth.uid()
             or public.has_role(auth.uid(), 'admin'))
    )
  );
drop policy if exists "inquiry_messages_participant_insert" on public.inquiry_messages;
create policy "inquiry_messages_participant_insert" on public.inquiry_messages
  for insert to authenticated with check (
    sender_id = auth.uid() and exists (
      select 1 from public.inquiries i
      left join public.sellers s on s.id = i.seller_id
      where i.id = inquiry_id
        and (i.buyer_id = auth.uid() or s.profile_id = auth.uid()
             or public.has_role(auth.uid(), 'admin'))
    )
  );
drop policy if exists "inquiry_messages_participant_update" on public.inquiry_messages;
create policy "inquiry_messages_participant_update" on public.inquiry_messages
  for update to authenticated using (
    exists (
      select 1 from public.inquiries i
      left join public.sellers s on s.id = i.seller_id
      where i.id = inquiry_id
        and (i.buyer_id = auth.uid() or s.profile_id = auth.uid()
             or public.has_role(auth.uid(), 'admin'))
    )
  );

-- ---------- inquiries: add status column for thread state ----------
alter table public.inquiries
  add column if not exists status text not null default 'open'
  check (status in ('open','responded','closed'));
alter table public.inquiries
  add column if not exists last_message_at timestamptz;

-- ---------- activity_log (timeline) ----------
create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  actor_role text,
  action text not null,        -- 'listing_created','listing_approved','inquiry_received','message_sent','seller_approved'...
  subject_type text,           -- 'car','inquiry','seller','import_request'
  subject_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists activity_log_user_idx on public.activity_log(user_id, created_at desc);
grant select, insert on public.activity_log to authenticated;
grant all on public.activity_log to service_role;
alter table public.activity_log enable row level security;
drop policy if exists "activity_own_select" on public.activity_log;
create policy "activity_own_select" on public.activity_log
  for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
drop policy if exists "activity_auth_insert" on public.activity_log;
create policy "activity_auth_insert" on public.activity_log
  for insert to authenticated with check (true);

-- ---------- cars: add 'draft' to status enum ----------
alter table public.cars drop constraint if exists cars_status_check;
alter table public.cars add constraint cars_status_check
  check (status in ('draft','pending','approved','rejected','sold','archived'));

-- ---------- Notification triggers ----------

-- New inquiry -> notify seller's profile
create or replace function public.notify_seller_on_inquiry()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_seller_profile uuid;
  v_car_title text;
begin
  select profile_id into v_seller_profile from public.sellers where id = new.seller_id;
  select title into v_car_title from public.cars where id = new.car_id;
  if v_seller_profile is not null then
    insert into public.notifications (user_id, type, title, body, link, metadata)
    values (
      v_seller_profile,
      'inquiry_new',
      'New inquiry from ' || coalesce(new.buyer_name, 'a buyer'),
      left(new.message, 200),
      '/seller/inquiries',
      jsonb_build_object('inquiry_id', new.id, 'car_id', new.car_id, 'car_title', v_car_title)
    );
  end if;
  return new;
end;
$$;
drop trigger if exists inquiries_notify_seller on public.inquiries;
create trigger inquiries_notify_seller
  after insert on public.inquiries
  for each row execute function public.notify_seller_on_inquiry();

-- Listing status change -> notify seller
create or replace function public.notify_on_listing_status()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_seller_profile uuid;
begin
  if new.status is distinct from old.status then
    select profile_id into v_seller_profile from public.sellers where id = new.seller_id;
    if v_seller_profile is not null then
      if new.status = 'approved' then
        insert into public.notifications (user_id, type, title, body, link, metadata)
        values (v_seller_profile, 'listing_approved', 'Your listing is live',
                '"' || new.title || '" was approved and is now visible to buyers.',
                '/cars/' || new.id::text,
                jsonb_build_object('car_id', new.id));
      elsif new.status = 'rejected' then
        insert into public.notifications (user_id, type, title, body, link, metadata)
        values (v_seller_profile, 'listing_rejected', 'Listing needs changes',
                coalesce(new.rejection_reason, 'Your listing was not approved.'),
                '/seller',
                jsonb_build_object('car_id', new.id));
      end if;
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists cars_notify_status on public.cars;
create trigger cars_notify_status
  after update of status on public.cars
  for each row execute function public.notify_on_listing_status();

-- Seller approval change -> notify
create or replace function public.notify_on_seller_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.is_approved is distinct from old.is_approved and new.is_approved = true then
    insert into public.notifications (user_id, type, title, body, link)
    values (new.profile_id, 'seller_approved',
            'You''re approved to sell',
            'Your seller account was approved. You can now publish listings.',
            '/seller');
  elsif new.rejection_reason is distinct from old.rejection_reason and new.rejection_reason is not null then
    insert into public.notifications (user_id, type, title, body, link)
    values (new.profile_id, 'seller_rejected',
            'Seller application not approved',
            new.rejection_reason, '/seller');
  end if;
  return new;
end;
$$;
drop trigger if exists sellers_notify_status on public.sellers;
create trigger sellers_notify_status
  after update on public.sellers
  for each row execute function public.notify_on_seller_status();

-- Inquiry message -> notify other party + bump last_message_at + set status
create or replace function public.notify_on_inquiry_message()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_buyer uuid;
  v_seller_profile uuid;
  v_recipient uuid;
  v_car_title text;
begin
  select i.buyer_id, s.profile_id, c.title
    into v_buyer, v_seller_profile, v_car_title
  from public.inquiries i
  left join public.sellers s on s.id = i.seller_id
  left join public.cars c on c.id = i.car_id
  where i.id = new.inquiry_id;

  update public.inquiries
     set last_message_at = now(),
         status = case when new.sender_role = 'seller' then 'responded' else status end
   where id = new.inquiry_id;

  v_recipient := case
    when new.sender_role = 'buyer' then v_seller_profile
    when new.sender_role = 'seller' then v_buyer
    else null end;

  if v_recipient is not null and v_recipient <> new.sender_id then
    insert into public.notifications (user_id, type, title, body, link, metadata)
    values (v_recipient, 'message_new',
            'New message',
            left(new.body, 200),
            '/seller/inquiries',
            jsonb_build_object('inquiry_id', new.inquiry_id, 'car_title', v_car_title));
  end if;
  return new;
end;
$$;
drop trigger if exists inquiry_messages_notify on public.inquiry_messages;
create trigger inquiry_messages_notify
  after insert on public.inquiry_messages
  for each row execute function public.notify_on_inquiry_message();

-- Import request status -> notify buyer
create or replace function public.notify_on_import_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status and new.buyer_id is not null then
    insert into public.notifications (user_id, type, title, body, link, metadata)
    values (new.buyer_id, 'import_status',
            'Import request updated',
            'Status: ' || new.status,
            '/account/import-requests',
            jsonb_build_object('import_request_id', new.id, 'status', new.status));
  end if;
  return new;
end;
$$;
drop trigger if exists import_requests_notify on public.import_requests;
create trigger import_requests_notify
  after update of status on public.import_requests
  for each row execute function public.notify_on_import_status();

-- ---------- broadcast helper (admin RPC) ----------
create or replace function public.broadcast_notification(
  _target text,          -- 'all','buyer','seller','admin'
  _title text,
  _body text,
  _link text default null
) returns integer language plpgsql security definer set search_path = public as $$
declare
  v_count integer;
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'forbidden';
  end if;
  insert into public.notifications (user_id, type, title, body, link, metadata)
  select p.id, 'broadcast', _title, _body, _link, jsonb_build_object('target', _target)
  from public.profiles p
  where _target = 'all' or p.role = _target;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;
grant execute on function public.broadcast_notification(text,text,text,text) to authenticated;

-- ---------- Realtime ----------
do $$ begin
  perform 1 from pg_publication where pubname = 'supabase_realtime';
  if found then
    begin
      execute 'alter publication supabase_realtime add table public.notifications';
    exception when duplicate_object then null; end;
    begin
      execute 'alter publication supabase_realtime add table public.inquiry_messages';
    exception when duplicate_object then null; end;
  end if;
end $$;

