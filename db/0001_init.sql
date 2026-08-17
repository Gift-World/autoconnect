-- =====================================================================
-- AutoConnect — Phase 1 schema, RLS, grants, triggers, seed
-- Run this entire file in your Supabase SQL Editor (one shot).
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------- profiles ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  whatsapp_number text,
  avatar_url text,
  role text not null default 'buyer' check (role in ('admin','seller','buyer')),
  country text,
  city text,
  is_suspended boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles_select_own" on public.profiles
  for select to authenticated using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles_insert_self" on public.profiles
  for insert to authenticated with check (auth.uid() = id);

-- has_role helper
create or replace function public.has_role(_user_id uuid, _role text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = _user_id and role = _role);
$$;
grant execute on function public.has_role(uuid, text) to anon, authenticated;

create policy "profiles_admin_all" on public.profiles
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));

-- ---------- sellers ----------
create table if not exists public.sellers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  business_name text,
  country text not null,
  city text,
  location_display text,
  offers_local_pickup boolean not null default true,
  offers_domestic_shipping boolean not null default false,
  offers_international_shipping boolean not null default false,
  is_verified boolean not null default false,
  is_approved boolean not null default false,
  is_suspended boolean not null default false,
  verification_badge boolean not null default false,
  rejection_reason text,
  created_at timestamptz not null default now(),
  unique (profile_id)
);
grant select on public.sellers to anon;
grant select, insert, update on public.sellers to authenticated;
grant all on public.sellers to service_role;
alter table public.sellers enable row level security;
create policy "sellers_public_approved" on public.sellers
  for select to anon, authenticated using (is_approved = true and is_suspended = false);
create policy "sellers_self_select" on public.sellers
  for select to authenticated using (profile_id = auth.uid());
create policy "sellers_self_insert" on public.sellers
  for insert to authenticated with check (profile_id = auth.uid());
create policy "sellers_self_update" on public.sellers
  for update to authenticated using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy "sellers_admin_all" on public.sellers
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ---------- car_makes ----------
create table if not exists public.car_makes (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  logo_url text,
  nhtsa_make_id integer,
  api_source text not null default 'manual',
  created_at timestamptz not null default now()
);
grant select on public.car_makes to anon, authenticated;
grant all on public.car_makes to service_role;
alter table public.car_makes enable row level security;
create policy "car_makes_public_read" on public.car_makes
  for select to anon, authenticated using (true);
create policy "car_makes_admin_write" on public.car_makes
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ---------- car_models ----------
create table if not exists public.car_models (
  id uuid primary key default gen_random_uuid(),
  make_id uuid not null references public.car_makes(id) on delete cascade,
  name text not null,
  nhtsa_model_id integer,
  api_source text not null default 'manual',
  created_at timestamptz not null default now(),
  unique (make_id, name)
);
grant select on public.car_models to anon, authenticated;
grant all on public.car_models to service_role;
alter table public.car_models enable row level security;
create policy "car_models_public_read" on public.car_models
  for select to anon, authenticated using (true);
create policy "car_models_admin_write" on public.car_models
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ---------- cars ----------
create table if not exists public.cars (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.sellers(id) on delete cascade,
  title text not null,
  make_id uuid references public.car_makes(id),
  model_id uuid references public.car_models(id),
  make_name text,
  model_name text,
  year integer not null,
  price numeric not null,
  currency text not null default 'USD',
  country text not null,
  city text,
  location_display text,
  mileage integer,
  mileage_unit text not null default 'km' check (mileage_unit in ('km','miles')),
  transmission text check (transmission in ('automatic','manual','semi-automatic')),
  fuel_type text check (fuel_type in ('petrol','diesel','electric','hybrid','other')),
  body_type text check (body_type in ('sedan','suv','hatchback','pickup','van','coupe','wagon','convertible','bus','other')),
  color text,
  engine_size text,
  condition text check (condition in ('new','foreign-used','locally-used')),
  description text,
  right_hand_drive boolean not null default false,
  steering_side text check (steering_side in ('left','right')),
  available_for_export boolean not null default false,
  shipping_info text,
  import_duties_note text,
  vin text,
  decoded_specs jsonb,
  api_source text,
  status text not null default 'pending' check (status in ('pending','approved','rejected','sold')),
  rejection_reason text,
  featured boolean not null default false,
  featured_until timestamptz,
  views integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists cars_status_idx on public.cars(status);
create index if not exists cars_country_idx on public.cars(country);
create index if not exists cars_seller_idx on public.cars(seller_id);
create index if not exists cars_featured_idx on public.cars(featured) where featured = true;
grant select on public.cars to anon;
grant select, insert, update, delete on public.cars to authenticated;
grant all on public.cars to service_role;
alter table public.cars enable row level security;
create policy "cars_public_approved" on public.cars
  for select to anon, authenticated using (status = 'approved');
create policy "cars_seller_own_select" on public.cars
  for select to authenticated
  using (seller_id in (select id from public.sellers where profile_id = auth.uid()));
create policy "cars_seller_own_insert" on public.cars
  for insert to authenticated
  with check (seller_id in (select id from public.sellers where profile_id = auth.uid()));
create policy "cars_seller_own_update" on public.cars
  for update to authenticated
  using (seller_id in (select id from public.sellers where profile_id = auth.uid()))
  with check (seller_id in (select id from public.sellers where profile_id = auth.uid()));
create policy "cars_seller_own_delete" on public.cars
  for delete to authenticated
  using (seller_id in (select id from public.sellers where profile_id = auth.uid()));
create policy "cars_admin_all" on public.cars
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ---------- car_images ----------
create table if not exists public.car_images (
  id uuid primary key default gen_random_uuid(),
  car_id uuid not null references public.cars(id) on delete cascade,
  image_url text not null,
  is_primary boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists car_images_car_idx on public.car_images(car_id);
grant select on public.car_images to anon;
grant select, insert, update, delete on public.car_images to authenticated;
grant all on public.car_images to service_role;
alter table public.car_images enable row level security;
create policy "car_images_public_approved" on public.car_images
  for select to anon, authenticated
  using (car_id in (select id from public.cars where status = 'approved'));
create policy "car_images_seller_own" on public.car_images
  for all to authenticated
  using (car_id in (select c.id from public.cars c join public.sellers s on s.id = c.seller_id where s.profile_id = auth.uid()))
  with check (car_id in (select c.id from public.cars c join public.sellers s on s.id = c.seller_id where s.profile_id = auth.uid()));
create policy "car_images_admin_all" on public.car_images
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ---------- inquiries ----------
create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  car_id uuid not null references public.cars(id) on delete cascade,
  buyer_id uuid references public.profiles(id) on delete set null,
  seller_id uuid not null references public.sellers(id) on delete cascade,
  buyer_name text not null,
  buyer_email text not null,
  buyer_phone text,
  buyer_country text,
  message text not null,
  inquiry_type text not null default 'general' check (inquiry_type in ('general','import_request','shipping_quote')),
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
grant insert on public.inquiries to anon;
grant select, insert, update on public.inquiries to authenticated;
grant all on public.inquiries to service_role;
alter table public.inquiries enable row level security;
create policy "inquiries_anyone_insert" on public.inquiries
  for insert to anon, authenticated with check (true);
create policy "inquiries_buyer_select_own" on public.inquiries
  for select to authenticated using (buyer_id = auth.uid());
create policy "inquiries_seller_select_own" on public.inquiries
  for select to authenticated
  using (seller_id in (select id from public.sellers where profile_id = auth.uid()));
create policy "inquiries_seller_update_own" on public.inquiries
  for update to authenticated
  using (seller_id in (select id from public.sellers where profile_id = auth.uid()))
  with check (seller_id in (select id from public.sellers where profile_id = auth.uid()));
create policy "inquiries_admin_all" on public.inquiries
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ---------- import_requests ----------
create table if not exists public.import_requests (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid references public.profiles(id) on delete set null,
  buyer_name text not null,
  buyer_email text not null,
  buyer_phone text,
  buyer_country text not null,
  make_name text not null,
  model_name text,
  year_from integer,
  year_to integer,
  budget_min numeric,
  budget_max numeric,
  budget_currency text not null default 'USD',
  preferred_condition text check (preferred_condition in ('new','foreign-used','locally-used','any')),
  preferred_source_country text,
  transmission_preference text,
  fuel_preference text,
  additional_notes text,
  status text not null default 'open' check (status in ('open','in_progress','fulfilled','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant insert on public.import_requests to anon;
grant select, insert, update on public.import_requests to authenticated;
grant all on public.import_requests to service_role;
alter table public.import_requests enable row level security;
create policy "import_requests_anyone_insert" on public.import_requests
  for insert to anon, authenticated with check (true);
create policy "import_requests_buyer_select_own" on public.import_requests
  for select to authenticated using (buyer_id = auth.uid());
create policy "import_requests_buyer_update_own" on public.import_requests
  for update to authenticated using (buyer_id = auth.uid()) with check (buyer_id = auth.uid());
create policy "import_requests_seller_select_open" on public.import_requests
  for select to authenticated
  using (status = 'open' and exists (
    select 1 from public.sellers s where s.profile_id = auth.uid()
      and s.is_approved = true and s.offers_international_shipping = true));
create policy "import_requests_admin_all" on public.import_requests
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ---------- favorites ----------
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  car_id uuid not null references public.cars(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (buyer_id, car_id)
);
grant select, insert, delete on public.favorites to authenticated;
grant all on public.favorites to service_role;
alter table public.favorites enable row level security;
create policy "favorites_own_all" on public.favorites
  for all to authenticated using (buyer_id = auth.uid()) with check (buyer_id = auth.uid());

-- ---------- reports ----------
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  car_id uuid not null references public.cars(id) on delete cascade,
  reporter_id uuid references public.profiles(id) on delete set null,
  reason text not null,
  details text,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.reports to authenticated;
grant all on public.reports to service_role;
alter table public.reports enable row level security;
create policy "reports_auth_insert" on public.reports
  for insert to authenticated with check (reporter_id = auth.uid());
create policy "reports_admin_all" on public.reports
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ---------- increment_car_views RPC ----------
create or replace function public.increment_car_views(car_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.cars set views = views + 1 where id = car_id;
$$;
grant execute on function public.increment_car_views(uuid) to anon, authenticated;

-- ---------- handle_new_user trigger ----------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_role text := coalesce(new.raw_user_meta_data->>'role', 'buyer');
  v_full_name text := coalesce(new.raw_user_meta_data->>'full_name', '');
  v_phone text := new.raw_user_meta_data->>'phone';
  v_country text := coalesce(new.raw_user_meta_data->>'country', 'US');
  v_city text := new.raw_user_meta_data->>'city';
begin
  if v_role not in ('admin','seller','buyer') then v_role := 'buyer'; end if;
  insert into public.profiles (id, full_name, phone, role, country, city)
  values (new.id, v_full_name, v_phone, v_role, v_country, v_city)
  on conflict (id) do nothing;
  if v_role = 'seller' then
    insert into public.sellers (profile_id, country, city, location_display, is_approved)
    values (new.id, v_country, v_city,
            coalesce(v_city || ', ' || v_country, v_country), false)
    on conflict (profile_id) do nothing;
  end if;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users for each row execute function public.handle_new_user();

-- ---------- updated_at ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
drop trigger if exists cars_set_updated_at on public.cars;
create trigger cars_set_updated_at before update on public.cars
  for each row execute function public.set_updated_at();
drop trigger if exists import_requests_set_updated_at on public.import_requests;
create trigger import_requests_set_updated_at before update on public.import_requests
  for each row execute function public.set_updated_at();

-- ---------- Storage bucket ----------
insert into storage.buckets (id, name, public)
values ('car-images', 'car-images', true)
on conflict (id) do nothing;
drop policy if exists "car_images_public_read" on storage.objects;
create policy "car_images_public_read" on storage.objects
  for select to anon, authenticated using (bucket_id = 'car-images');
drop policy if exists "car_images_owner_write" on storage.objects;
create policy "car_images_owner_write" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'car-images' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "car_images_owner_update" on storage.objects;
create policy "car_images_owner_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'car-images' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "car_images_owner_delete" on storage.objects;
create policy "car_images_owner_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'car-images' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------- Seed makes ----------
insert into public.car_makes (name, api_source) values
  ('Toyota','manual'),('Nissan','manual'),('Subaru','manual'),('Isuzu','manual'),
  ('Mitsubishi','manual'),('Honda','manual'),('BMW','manual'),('Mercedes-Benz','manual'),
  ('Volkswagen','manual'),('Ford','manual'),('Mazda','manual'),('Hyundai','manual'),
  ('Kia','manual'),('Land Rover','manual'),('Suzuki','manual'),('Lexus','manual'),
  ('Audi','manual'),('Porsche','manual'),('Jeep','manual'),('Chevrolet','manual'),
  ('Peugeot','manual'),('Renault','manual'),('Volvo','manual'),('Jaguar','manual'),
  ('Range Rover','manual')
on conflict (name) do nothing;

-- ---------- Seed models ----------
with mk as (select id, name from public.car_makes)
insert into public.car_models (make_id, name, api_source)
select mk.id, m.name, 'manual'
from (values
  ('Toyota','Corolla'),('Toyota','Camry'),('Toyota','RAV4'),('Toyota','Land Cruiser'),
  ('Toyota','Hilux'),('Toyota','Prado'),('Toyota','Fielder'),('Toyota','Wish'),
  ('Toyota','Vanguard'),('Toyota','Harrier'),('Toyota','Fortuner'),
  ('Nissan','X-Trail'),('Nissan','Note'),('Nissan','Tiida'),('Nissan','Navara'),
  ('Nissan','Patrol'),('Nissan','Juke'),('Nissan','Leaf'),('Nissan','GT-R'),
  ('BMW','3 Series'),('BMW','5 Series'),('BMW','7 Series'),('BMW','X3'),
  ('BMW','X5'),('BMW','X6'),('BMW','M3'),('BMW','M5'),
  ('Mercedes-Benz','C-Class'),('Mercedes-Benz','E-Class'),('Mercedes-Benz','S-Class'),
  ('Mercedes-Benz','GLE'),('Mercedes-Benz','GLC'),('Mercedes-Benz','G-Class'),
  ('Subaru','Forester'),('Subaru','Outback'),('Subaru','Legacy'),
  ('Subaru','Impreza'),('Subaru','XV'),('Subaru','WRX')
) as m(make, name)
join mk on mk.name = m.make
on conflict (make_id, name) do nothing;

-- =====================================================================
-- DONE. Then create admin user in Supabase dashboard:
--   Auth → Add User → email=giftworld325@gmail.com, set password, auto-confirm
-- Then run:
--   update public.profiles set role='admin'
--     where id = (select id from auth.users where email='giftworld325@gmail.com');
-- =====================================================================
