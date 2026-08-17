-- Phase 1: Verification system
-- Adds seller identity, car document, inspection, mechanic, and document
-- release tables, plus verified flags on cars/sellers and a recompute trigger.

begin;

-- ============================================================
-- Column additions to existing tables
-- ============================================================

alter table public.sellers
  add column if not exists identity_verified boolean not null default false,
  add column if not exists is_dealer boolean not null default false,
  add column if not exists verification_level integer not null default 0;

alter table public.cars
  add column if not exists number_plate text,
  add column if not exists chassis_number text,
  add column if not exists engine_number text,
  add column if not exists identity_verified boolean not null default false,
  add column if not exists documents_verified boolean not null default false,
  add column if not exists ntsa_verified boolean not null default false,
  add column if not exists inspection_verified boolean not null default false,
  add column if not exists import_duties_verified boolean not null default false,
  add column if not exists verification_level integer not null default 0;

-- ============================================================
-- seller_verifications
-- ============================================================

create table if not exists public.seller_verifications (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.sellers(id) on delete cascade,

  -- Identity documents
  national_id_number text,
  national_id_front_url text,
  national_id_back_url text,
  selfie_with_id_url text,
  proof_of_address_url text,
  address_county text,
  address_town text,
  address_street text,

  -- Business documents (dealers)
  is_dealer boolean not null default false,
  business_name text,
  business_reg_number text,
  incorporation_cert_url text,
  kra_pin_url text,
  business_permit_url text,
  premises_photo_url text,

  identity_verified boolean not null default false,
  identity_verified_at timestamptz,
  identity_verified_by uuid references public.profiles(id),
  identity_rejection_reason text,

  status text not null default 'pending' check (
    status in ('pending','under_review','verified','rejected','more_info_needed')
  ),
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (seller_id)
);

grant select, insert, update on public.seller_verifications to authenticated;
grant all on public.seller_verifications to service_role;
alter table public.seller_verifications enable row level security;

create policy sv_self_select on public.seller_verifications
  for select to authenticated
  using (seller_id in (select id from public.sellers where profile_id = auth.uid()));
create policy sv_self_insert on public.seller_verifications
  for insert to authenticated
  with check (seller_id in (select id from public.sellers where profile_id = auth.uid()));
create policy sv_self_update on public.seller_verifications
  for update to authenticated
  using (seller_id in (select id from public.sellers where profile_id = auth.uid()))
  with check (seller_id in (select id from public.sellers where profile_id = auth.uid()));
create policy sv_admin_all on public.seller_verifications
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- car_verifications
-- ============================================================

create table if not exists public.car_verifications (
  id uuid primary key default gen_random_uuid(),
  car_id uuid not null references public.cars(id) on delete cascade,
  seller_id uuid references public.sellers(id),

  -- Ownership
  logbook_front_url text,
  logbook_back_url text,
  transfer_docs_url text,

  -- Registration
  number_plate text,
  number_plate_front_photo_url text,
  number_plate_rear_photo_url text,
  insurance_cert_url text,
  insurance_expiry date,
  inspection_cert_url text,
  inspection_expiry date,
  road_license_url text,
  road_license_expiry date,

  -- Import docs
  is_imported boolean not null default false,
  import_entry_url text,
  idf_url text,
  duty_payment_url text,
  release_order_url text,
  port_inspection_url text,

  -- Finance
  has_financing boolean not null default false,
  finance_clearance_url text,

  -- Accidents
  has_accident_history boolean not null default false,
  accident_severity text check (accident_severity in ('none','minor','major')),
  accident_details text,
  repair_records_url text,

  -- Numbers
  chassis_number text,
  engine_number text,

  -- Verification results
  documents_verified boolean not null default false,
  documents_verified_at timestamptz,
  documents_verified_by uuid references public.profiles(id),
  ntsa_verified boolean not null default false,
  ntsa_verified_at timestamptz,
  ntsa_verified_by uuid references public.profiles(id),
  ntsa_notes text,
  import_duties_verified boolean not null default false,

  encumbrance_found boolean not null default false,
  ownership_mismatch boolean not null default false,
  document_rejection_reasons jsonb,

  status text not null default 'pending' check (
    status in ('pending','under_review','verified','rejected','more_info_needed')
  ),
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (car_id)
);

grant select, insert, update on public.car_verifications to authenticated;
grant all on public.car_verifications to service_role;
alter table public.car_verifications enable row level security;

create policy cv_self_select on public.car_verifications
  for select to authenticated
  using (seller_id in (select id from public.sellers where profile_id = auth.uid()));
create policy cv_self_insert on public.car_verifications
  for insert to authenticated
  with check (seller_id in (select id from public.sellers where profile_id = auth.uid()));
create policy cv_self_update on public.car_verifications
  for update to authenticated
  using (seller_id in (select id from public.sellers where profile_id = auth.uid()))
  with check (seller_id in (select id from public.sellers where profile_id = auth.uid()));
create policy cv_admin_all on public.car_verifications
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- mechanics
-- ============================================================

create table if not exists public.mechanics (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references public.profiles(id) on delete cascade,
  full_name text not null,
  phone text not null,
  areas_covered text[] not null default '{}',
  is_active boolean not null default true,
  inspections_completed integer not null default 0,
  rating numeric not null default 0,
  created_at timestamptz not null default now()
);

grant select on public.mechanics to authenticated;
grant all on public.mechanics to service_role;
alter table public.mechanics enable row level security;

create policy mech_self_select on public.mechanics
  for select to authenticated
  using (profile_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy mech_admin_all on public.mechanics
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- inspections
-- ============================================================

create table if not exists public.inspections (
  id uuid primary key default gen_random_uuid(),
  car_id uuid not null references public.cars(id) on delete cascade,
  seller_id uuid references public.sellers(id),
  mechanic_id uuid references public.profiles(id),

  scheduled_date date,
  scheduled_time time,
  inspection_location text,
  seller_contact_for_inspection text,
  status text not null default 'pending' check (
    status in ('pending','scheduled','in_progress','completed','cancelled','no_show')
  ),

  inspection_fee numeric not null default 3500,
  fee_currency text not null default 'KES',
  fee_paid boolean not null default false,

  -- Exterior
  body_condition_score integer check (body_condition_score between 1 and 5),
  paint_condition text,
  paint_is_original boolean,
  glass_condition text,
  lights_working boolean,
  tyre_condition text,
  tyre_tread_depth text,
  underbody_condition text,

  -- Engine
  engine_starts_well boolean,
  engine_noise_notes text,
  oil_condition text,
  coolant_condition text,
  belt_condition text,
  battery_condition text,
  exhaust_condition text,

  -- Mechanical
  brake_condition text,
  steering_condition text,
  suspension_condition text,
  transmission_condition text,

  -- Interior
  interior_condition_score integer check (interior_condition_score between 1 and 5),
  ac_working boolean,
  electronics_working boolean,
  warning_lights_present boolean,
  warning_lights_details text,

  -- Test drive
  test_drive_done boolean not null default false,
  test_drive_notes text,

  -- Numbers
  chassis_number_found text,
  engine_number_found text,
  chassis_number_verified boolean,
  engine_number_verified boolean,
  numbers_match_logbook boolean,

  overall_condition_score integer check (overall_condition_score between 1 and 10),
  recommended_price_min numeric,
  recommended_price_max numeric,
  mechanic_verdict text check (mechanic_verdict in ('pass','conditional_pass','fail')),
  mechanic_notes text,

  inspection_photos jsonb,

  admin_reviewed boolean not null default false,
  admin_approved boolean,
  admin_notes text,

  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update on public.inspections to authenticated;
grant all on public.inspections to service_role;
alter table public.inspections enable row level security;

create policy insp_mechanic_select on public.inspections
  for select to authenticated
  using (mechanic_id = auth.uid());
create policy insp_mechanic_update on public.inspections
  for update to authenticated
  using (mechanic_id = auth.uid())
  with check (mechanic_id = auth.uid());
create policy insp_seller_select on public.inspections
  for select to authenticated
  using (seller_id in (select id from public.sellers where profile_id = auth.uid()));
create policy insp_admin_all on public.inspections
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- document_releases
-- ============================================================

create table if not exists public.document_releases (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid references public.transactions(id) on delete cascade,
  car_id uuid references public.cars(id),
  buyer_id uuid references public.profiles(id),
  released_by uuid references public.profiles(id),
  documents_released jsonb not null default '[]'::jsonb,
  released_at timestamptz not null default now(),
  buyer_acknowledged boolean not null default false,
  buyer_acknowledged_at timestamptz
);

grant select, update on public.document_releases to authenticated;
grant all on public.document_releases to service_role;
alter table public.document_releases enable row level security;

create policy dr_buyer_select on public.document_releases
  for select to authenticated
  using (buyer_id = auth.uid());
create policy dr_buyer_ack on public.document_releases
  for update to authenticated
  using (buyer_id = auth.uid())
  with check (buyer_id = auth.uid());
create policy dr_admin_all on public.document_releases
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- Verification level recompute trigger on cars
-- ============================================================

create or replace function public.recompute_car_verification_level()
returns trigger language plpgsql as $$
begin
  new.verification_level :=
      (case when new.identity_verified then 1 else 0 end)
    + (case when new.documents_verified then 1 else 0 end)
    + (case when new.ntsa_verified then 1 else 0 end)
    + (case when new.inspection_verified then 1 else 0 end);
  return new;
end $$;

drop trigger if exists trg_recompute_car_verification on public.cars;
create trigger trg_recompute_car_verification
  before insert or update of identity_verified, documents_verified,
    ntsa_verified, inspection_verified
  on public.cars
  for each row execute function public.recompute_car_verification_level();

-- Seller verification_level recompute (currently identity only)
create or replace function public.recompute_seller_verification_level()
returns trigger language plpgsql as $$
begin
  new.verification_level := case when new.identity_verified then 1 else 0 end;
  return new;
end $$;

drop trigger if exists trg_recompute_seller_verification on public.sellers;
create trigger trg_recompute_seller_verification
  before insert or update of identity_verified
  on public.sellers
  for each row execute function public.recompute_seller_verification_level();

-- ============================================================
-- updated_at triggers
-- ============================================================

do $$ begin
  if not exists (select 1 from pg_proc where proname = 'set_updated_at') then
    create function public.set_updated_at() returns trigger language plpgsql as $f$
    begin new.updated_at := now(); return new; end $f$;
  end if;
end $$;

drop trigger if exists trg_sv_updated on public.seller_verifications;
create trigger trg_sv_updated before update on public.seller_verifications
  for each row execute function public.set_updated_at();
drop trigger if exists trg_cv_updated on public.car_verifications;
create trigger trg_cv_updated before update on public.car_verifications
  for each row execute function public.set_updated_at();
drop trigger if exists trg_insp_updated on public.inspections;
create trigger trg_insp_updated before update on public.inspections
  for each row execute function public.set_updated_at();

commit;
