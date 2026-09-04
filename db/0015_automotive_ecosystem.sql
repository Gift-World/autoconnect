-- =====================================================================
-- 0015 — Automotive ecosystem: My Garage, global parts and providers
-- Apply after 0014. A single authenticated profile may own vehicles and
-- operate multiple business capabilities without changing its primary role.
-- =====================================================================

begin;

create table if not exists public.garage_vehicles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  car_id uuid references public.cars(id) on delete set null,
  nickname text,
  make_name text not null,
  model_name text,
  year integer,
  vin text,
  mileage integer,
  mileage_unit text not null default 'km' check (mileage_unit in ('km', 'miles')),
  next_service_at date,
  next_service_mileage integer,
  insurance_renews_at date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists garage_vehicles_owner_idx on public.garage_vehicles(owner_id);
grant select, insert, update, delete on public.garage_vehicles to authenticated;
grant all on public.garage_vehicles to service_role;
alter table public.garage_vehicles enable row level security;
create policy "garage_vehicles_owner_all" on public.garage_vehicles
  for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create table if not exists public.parts_shops (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  slug text not null unique,
  name text not null,
  description text,
  logo_url text,
  country text not null,
  city text,
  address text,
  phone text,
  whatsapp text,
  email text,
  shipping_regions text[] not null default '{}',
  return_policy text,
  is_verified boolean not null default false,
  is_approved boolean not null default false,
  is_suspended boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id, name)
);
create index if not exists parts_shops_owner_idx on public.parts_shops(owner_id);
create index if not exists parts_shops_public_idx on public.parts_shops(is_approved, is_suspended);
grant select on public.parts_shops to anon, authenticated;
grant insert, update, delete on public.parts_shops to authenticated;
grant all on public.parts_shops to service_role;
alter table public.parts_shops enable row level security;
create policy "parts_shops_public_approved" on public.parts_shops
  for select to anon, authenticated using (is_approved = true and is_suspended = false);
create policy "parts_shops_owner_all" on public.parts_shops
  for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "parts_shops_admin_all" on public.parts_shops
  for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create table if not exists public.parts (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.parts_shops(id) on delete cascade,
  title text not null,
  brand text,
  part_number text,
  category text not null,
  condition text not null default 'new' check (condition in ('new', 'refurbished', 'used')),
  description text,
  price numeric not null check (price >= 0),
  currency text not null default 'USD',
  country text not null,
  city text,
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  shipping_regions text[] not null default '{}',
  warranty_text text,
  return_policy text,
  image_url text,
  status text not null default 'draft' check (status in ('draft', 'pending', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists parts_shop_idx on public.parts(shop_id);
create index if not exists parts_public_idx on public.parts(status, category, country);
create index if not exists parts_part_number_idx on public.parts(part_number);
grant select on public.parts to anon, authenticated;
grant insert, update, delete on public.parts to authenticated;
grant all on public.parts to service_role;
alter table public.parts enable row level security;
create policy "parts_public_published" on public.parts
  for select to anon, authenticated using (
    status = 'published' and shop_id in (
      select id from public.parts_shops where is_approved = true and is_suspended = false
    )
  );
create policy "parts_shop_owner_all" on public.parts
  for all to authenticated using (shop_id in (select id from public.parts_shops where owner_id = auth.uid()))
  with check (shop_id in (select id from public.parts_shops where owner_id = auth.uid()));
create policy "parts_admin_all" on public.parts
  for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create table if not exists public.part_fitments (
  id uuid primary key default gen_random_uuid(),
  part_id uuid not null references public.parts(id) on delete cascade,
  make_name text not null,
  model_name text,
  year_from integer,
  year_to integer,
  engine text,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists part_fitments_part_idx on public.part_fitments(part_id);
grant select on public.part_fitments to anon, authenticated;
grant insert, update, delete on public.part_fitments to authenticated;
grant all on public.part_fitments to service_role;
alter table public.part_fitments enable row level security;
create policy "part_fitments_public_for_published" on public.part_fitments
  for select to anon, authenticated using (part_id in (select id from public.parts where status = 'published'));
create policy "part_fitments_shop_owner_all" on public.part_fitments
  for all to authenticated using (part_id in (select p.id from public.parts p join public.parts_shops s on s.id = p.shop_id where s.owner_id = auth.uid()))
  with check (part_id in (select p.id from public.parts p join public.parts_shops s on s.id = p.shop_id where s.owner_id = auth.uid()));

create table if not exists public.parts_orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles(id) on delete restrict,
  shop_id uuid not null references public.parts_shops(id) on delete restrict,
  part_id uuid not null references public.parts(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  unit_price numeric not null check (unit_price >= 0),
  currency text not null,
  destination_country text not null,
  destination_city text,
  shipping_method text,
  status text not null default 'requested' check (status in ('requested', 'quoted', 'awaiting_payment', 'paid', 'packed', 'shipped', 'delivered', 'cancelled', 'refunded')),
  tracking_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists parts_orders_buyer_idx on public.parts_orders(buyer_id, created_at desc);
create index if not exists parts_orders_shop_idx on public.parts_orders(shop_id, created_at desc);
grant select, insert on public.parts_orders to authenticated;
grant update on public.parts_orders to authenticated;
grant all on public.parts_orders to service_role;
alter table public.parts_orders enable row level security;
create policy "parts_orders_buyer_select" on public.parts_orders for select to authenticated using (buyer_id = auth.uid());
create policy "parts_orders_buyer_insert" on public.parts_orders for insert to authenticated with check (buyer_id = auth.uid());
create policy "parts_orders_shop_select" on public.parts_orders for select to authenticated using (shop_id in (select id from public.parts_shops where owner_id = auth.uid()));
create policy "parts_orders_shop_update" on public.parts_orders for update to authenticated using (shop_id in (select id from public.parts_shops where owner_id = auth.uid())) with check (shop_id in (select id from public.parts_shops where owner_id = auth.uid()));
create policy "parts_orders_admin_all" on public.parts_orders for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create table if not exists public.service_providers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  provider_type text not null check (provider_type in ('garage', 'mechanic', 'inspection', 'logistics', 'insurance', 'roadside')),
  country text not null,
  city text,
  description text,
  phone text,
  is_verified boolean not null default false,
  is_approved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists service_providers_public_idx on public.service_providers(is_approved, provider_type, country);
grant select on public.service_providers to anon, authenticated;
grant insert, update, delete on public.service_providers to authenticated;
grant all on public.service_providers to service_role;
alter table public.service_providers enable row level security;
create policy "service_providers_public_approved" on public.service_providers for select to anon, authenticated using (is_approved = true);
create policy "service_providers_owner_all" on public.service_providers for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "service_providers_admin_all" on public.service_providers for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

drop trigger if exists garage_vehicles_set_updated_at on public.garage_vehicles;
create trigger garage_vehicles_set_updated_at before update on public.garage_vehicles for each row execute function public.set_updated_at();
drop trigger if exists parts_shops_set_updated_at on public.parts_shops;
create trigger parts_shops_set_updated_at before update on public.parts_shops for each row execute function public.set_updated_at();
drop trigger if exists parts_set_updated_at on public.parts;
create trigger parts_set_updated_at before update on public.parts for each row execute function public.set_updated_at();
drop trigger if exists parts_orders_set_updated_at on public.parts_orders;
create trigger parts_orders_set_updated_at before update on public.parts_orders for each row execute function public.set_updated_at();
drop trigger if exists service_providers_set_updated_at on public.service_providers;
create trigger service_providers_set_updated_at before update on public.service_providers for each row execute function public.set_updated_at();

commit;
