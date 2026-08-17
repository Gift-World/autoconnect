-- Buyer KYC + admin-only lock triggers
begin;

alter table public.profiles
  add column if not exists id_type text check (id_type in ('national_id','passport')),
  add column if not exists id_number text,
  add column if not exists payment_contact text,
  add column if not exists kyc_status text not null default 'none'
    check (kyc_status in ('none','submitted','approved','rejected')),
  add column if not exists kyc_submitted_at timestamptz,
  add column if not exists kyc_reviewed_at timestamptz,
  add column if not exists kyc_reviewed_by uuid references public.profiles(id),
  add column if not exists kyc_notes text;

-- Lock admin-only KYC fields on profiles (buyers may only set kyc_status='submitted')
create or replace function public._profiles_kyc_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare is_admin boolean := public.has_role(auth.uid(), 'admin');
begin
  if is_admin then return new; end if;
  if tg_op = 'INSERT' then
    new.kyc_status := 'none';
    new.kyc_submitted_at := null;
    new.kyc_reviewed_at := null;
    new.kyc_reviewed_by := null;
    new.kyc_notes := null;
    return new;
  end if;
  -- UPDATE: buyer may set kyc_status to 'submitted' only; cannot touch review fields
  if new.kyc_status is distinct from old.kyc_status
     and new.kyc_status <> 'submitted' then
    raise exception '42501: kyc_status can only be set to submitted by the user';
  end if;
  if new.kyc_reviewed_at is distinct from old.kyc_reviewed_at
     or new.kyc_reviewed_by is distinct from old.kyc_reviewed_by
     or new.kyc_notes is distinct from old.kyc_notes then
    raise exception '42501: kyc review fields are admin-only';
  end if;
  return new;
end $$;

drop trigger if exists trg_profiles_kyc_guard on public.profiles;
create trigger trg_profiles_kyc_guard
  before insert or update on public.profiles
  for each row execute function public._profiles_kyc_guard();

commit;

