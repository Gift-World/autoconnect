-- =====================================================================
-- 0022 — RLS hardening phase 2: Prevent role escalation, unauthorized approvals, and spoofing
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- PROFILES
-- Prevent non-admins from changing their role or is_suspended status.
-- ---------------------------------------------------------------------
create or replace function public.guard_profiles_admin_fields()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public._is_admin() then
    return new;
  end if;

  if new.role is distinct from old.role then
    raise exception 'Forbidden: only admins may modify profiles.role' using errcode = '42501';
  end if;
  if new.is_suspended is distinct from old.is_suspended then
    raise exception 'Forbidden: only admins may modify profiles.is_suspended' using errcode = '42501';
  end if;
  
  return new;
end $$;

drop trigger if exists trg_guard_profiles_admin on public.profiles;
create trigger trg_guard_profiles_admin
  before update on public.profiles
  for each row execute function public.guard_profiles_admin_fields();

-- ---------------------------------------------------------------------
-- PARTS SHOPS
-- Prevent non-admins from changing is_approved, is_verified, or is_suspended.
-- ---------------------------------------------------------------------
create or replace function public.guard_parts_shops_admin_fields()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public._is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.is_approved := false;
    new.is_verified := false;
    new.is_suspended := false;
    return new;
  end if;

  if new.is_approved is distinct from old.is_approved then
    raise exception 'Forbidden: only admins may modify parts_shops.is_approved' using errcode = '42501';
  end if;
  if new.is_verified is distinct from old.is_verified then
    raise exception 'Forbidden: only admins may modify parts_shops.is_verified' using errcode = '42501';
  end if;
  if new.is_suspended is distinct from old.is_suspended then
    raise exception 'Forbidden: only admins may modify parts_shops.is_suspended' using errcode = '42501';
  end if;
  
  return new;
end $$;

drop trigger if exists trg_guard_parts_shops_admin on public.parts_shops;
create trigger trg_guard_parts_shops_admin
  before insert or update on public.parts_shops
  for each row execute function public.guard_parts_shops_admin_fields();

-- ---------------------------------------------------------------------
-- SERVICE PROVIDERS
-- Prevent non-admins from changing is_approved or is_verified.
-- (is_suspended is not in the schema, so we only guard what exists)
-- ---------------------------------------------------------------------
create or replace function public.guard_service_providers_admin_fields()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public._is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.is_approved := false; 
    new.is_verified := false;
    return new;
  end if;

  if new.is_approved is distinct from old.is_approved then
    raise exception 'Forbidden: only admins may modify service_providers.is_approved' using errcode = '42501';
  end if;
  if new.is_verified is distinct from old.is_verified then
    raise exception 'Forbidden: only admins may modify service_providers.is_verified' using errcode = '42501';
  end if;

  return new;
end $$;

drop trigger if exists trg_guard_service_providers_admin on public.service_providers;
create trigger trg_guard_service_providers_admin
  before insert or update on public.service_providers
  for each row execute function public.guard_service_providers_admin_fields();

-- ---------------------------------------------------------------------
-- INQUIRY MESSAGES
-- Prevent editing message body, attachments, or core identifiers after sending.
-- ---------------------------------------------------------------------
create or replace function public.guard_inquiry_messages_immutable()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public._is_admin() then
    return new;
  end if;

  if new.message is distinct from old.message then
    raise exception 'Forbidden: cannot edit message body' using errcode = '42501';
  end if;
  if new.attachment_url is distinct from old.attachment_url then
    raise exception 'Forbidden: cannot edit message attachment' using errcode = '42501';
  end if;
  if new.sender_id is distinct from old.sender_id then
    raise exception 'Forbidden: cannot change sender' using errcode = '42501';
  end if;
  if new.inquiry_id is distinct from old.inquiry_id then
    raise exception 'Forbidden: cannot change inquiry' using errcode = '42501';
  end if;

  return new;
end $$;

drop trigger if exists trg_guard_inquiry_messages_immutable on public.inquiry_messages;
create trigger trg_guard_inquiry_messages_immutable
  before update on public.inquiry_messages
  for each row execute function public.guard_inquiry_messages_immutable();

-- ---------------------------------------------------------------------
-- IMPORT REQUESTS
-- Prevent buyers from setting status to anything other than open/closed.
-- ---------------------------------------------------------------------
create or replace function public.guard_import_requests_buyer()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public._is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.status is distinct from 'open' then
       new.status := 'open';
    end if;
    return new;
  end if;

  if new.status is distinct from old.status then
    if new.status not in ('open', 'closed') then
       raise exception 'Forbidden: cannot set import request status to %', new.status using errcode = '42501';
    end if;
  end if;

  return new;
end $$;

drop trigger if exists trg_guard_import_requests on public.import_requests;
create trigger trg_guard_import_requests
  before insert or update on public.import_requests
  for each row execute function public.guard_import_requests_buyer();

commit;
