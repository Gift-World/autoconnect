-- =====================================================================
-- 0006 — RLS hardening: lock trust / status / verification fields
-- so sellers cannot approve or verify themselves, change listing
-- status, or edit admin-only trust fields. Admin UI keeps working
-- because admins pass has_role(auth.uid(), 'admin').
-- No new tables. Uses BEFORE INSERT/UPDATE guards + column REVOKEs
-- as belt-and-braces.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------
create or replace function public._is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.has_role(auth.uid(), 'admin'), false);
$$;
grant execute on function public._is_admin() to anon, authenticated;

-- Reused error
create or replace function public._forbid_admin_field(_field text)
returns void language plpgsql as $$
begin
  raise exception 'Forbidden: only admins may modify %', _field
    using errcode = '42501';
end $$;

-- ---------------------------------------------------------------------
-- SELLERS — sellers may only edit business/contact fields.
-- Admin-only: is_approved, is_verified, is_suspended, verification_badge,
-- rejection_reason, identity_verified, verification_level, is_dealer.
-- (is_dealer becomes admin-set once identity is verified; on insert
-- sellers may declare it, but cannot flip it later.)
-- ---------------------------------------------------------------------
create or replace function public.guard_sellers_admin_fields()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public._is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    -- Force safe defaults on self-insert; ignore anything the client sent.
    new.is_approved         := false;
    new.is_verified         := false;
    new.is_suspended        := false;
    new.verification_badge  := false;
    new.rejection_reason    := null;
    new.identity_verified   := false;
    new.verification_level  := 0;
    return new;
  end if;

  -- UPDATE: any change to a protected column is rejected.
  if new.is_approved        is distinct from old.is_approved        then perform public._forbid_admin_field('sellers.is_approved'); end if;
  if new.is_verified        is distinct from old.is_verified        then perform public._forbid_admin_field('sellers.is_verified'); end if;
  if new.is_suspended       is distinct from old.is_suspended       then perform public._forbid_admin_field('sellers.is_suspended'); end if;
  if new.verification_badge is distinct from old.verification_badge then perform public._forbid_admin_field('sellers.verification_badge'); end if;
  if new.rejection_reason   is distinct from old.rejection_reason   then perform public._forbid_admin_field('sellers.rejection_reason'); end if;
  if new.identity_verified  is distinct from old.identity_verified  then perform public._forbid_admin_field('sellers.identity_verified'); end if;
  if new.verification_level is distinct from old.verification_level then perform public._forbid_admin_field('sellers.verification_level'); end if;
  if new.is_dealer          is distinct from old.is_dealer          then perform public._forbid_admin_field('sellers.is_dealer'); end if;

  return new;
end $$;

drop trigger if exists trg_guard_sellers_admin on public.sellers;
create trigger trg_guard_sellers_admin
  before insert or update on public.sellers
  for each row execute function public.guard_sellers_admin_fields();

-- ---------------------------------------------------------------------
-- CARS — sellers may only edit listing content on their own listings.
-- Admin-only: status, rejection_reason, featured, featured_until,
-- identity_verified, documents_verified, ntsa_verified,
-- inspection_verified, import_duties_verified, verification_level.
-- Also: sellers cannot mutate an approved/sold/rejected listing
-- (they must ask admin). `views` is exempt (bumped via SECURITY
-- DEFINER RPC increment_car_views).
-- ---------------------------------------------------------------------
create or replace function public.guard_cars_admin_fields()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public._is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    -- Force safe defaults; seller listings always start pending & unverified.
    new.status                  := 'pending';
    new.rejection_reason        := null;
    new.featured                := false;
    new.featured_until          := null;
    new.identity_verified       := false;
    new.documents_verified      := false;
    new.ntsa_verified           := false;
    new.inspection_verified     := false;
    new.import_duties_verified  := false;
    new.verification_level      := 0;
    return new;
  end if;

  -- Freeze non-pending listings for the seller (only admin can edit).
  if old.status <> 'pending' then
    raise exception 'Forbidden: listing is % — only admins can modify it', old.status
      using errcode = '42501';
  end if;

  -- Block admin-only column edits.
  if new.status                 is distinct from old.status                 then perform public._forbid_admin_field('cars.status'); end if;
  if new.rejection_reason       is distinct from old.rejection_reason       then perform public._forbid_admin_field('cars.rejection_reason'); end if;
  if new.featured               is distinct from old.featured               then perform public._forbid_admin_field('cars.featured'); end if;
  if new.featured_until         is distinct from old.featured_until         then perform public._forbid_admin_field('cars.featured_until'); end if;
  if new.identity_verified      is distinct from old.identity_verified      then perform public._forbid_admin_field('cars.identity_verified'); end if;
  if new.documents_verified     is distinct from old.documents_verified     then perform public._forbid_admin_field('cars.documents_verified'); end if;
  if new.ntsa_verified          is distinct from old.ntsa_verified          then perform public._forbid_admin_field('cars.ntsa_verified'); end if;
  if new.inspection_verified    is distinct from old.inspection_verified    then perform public._forbid_admin_field('cars.inspection_verified'); end if;
  if new.import_duties_verified is distinct from old.import_duties_verified then perform public._forbid_admin_field('cars.import_duties_verified'); end if;
  if new.verification_level     is distinct from old.verification_level     then perform public._forbid_admin_field('cars.verification_level'); end if;

  return new;
end $$;

drop trigger if exists trg_guard_cars_admin on public.cars;
create trigger trg_guard_cars_admin
  before insert or update on public.cars
  for each row execute function public.guard_cars_admin_fields();

-- ---------------------------------------------------------------------
-- SELLER_VERIFICATIONS — seller uploads docs; admin decides.
-- Admin-only: identity_verified, identity_verified_at, identity_verified_by,
-- identity_rejection_reason, status, admin_notes.
-- ---------------------------------------------------------------------
create or replace function public.guard_seller_verifications_admin_fields()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public._is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.identity_verified          := false;
    new.identity_verified_at       := null;
    new.identity_verified_by       := null;
    new.identity_rejection_reason  := null;
    new.status                     := 'pending';
    new.admin_notes                := null;
    return new;
  end if;

  -- Seller cannot resubmit after a decision has been recorded.
  if old.status in ('verified','rejected') then
    raise exception 'Forbidden: verification is % — contact support', old.status
      using errcode = '42501';
  end if;

  if new.identity_verified         is distinct from old.identity_verified         then perform public._forbid_admin_field('seller_verifications.identity_verified'); end if;
  if new.identity_verified_at      is distinct from old.identity_verified_at      then perform public._forbid_admin_field('seller_verifications.identity_verified_at'); end if;
  if new.identity_verified_by      is distinct from old.identity_verified_by      then perform public._forbid_admin_field('seller_verifications.identity_verified_by'); end if;
  if new.identity_rejection_reason is distinct from old.identity_rejection_reason then perform public._forbid_admin_field('seller_verifications.identity_rejection_reason'); end if;
  if new.status                    is distinct from old.status                    then perform public._forbid_admin_field('seller_verifications.status'); end if;
  if new.admin_notes               is distinct from old.admin_notes               then perform public._forbid_admin_field('seller_verifications.admin_notes'); end if;

  return new;
end $$;

drop trigger if exists trg_guard_sv_admin on public.seller_verifications;
create trigger trg_guard_sv_admin
  before insert or update on public.seller_verifications
  for each row execute function public.guard_seller_verifications_admin_fields();

-- ---------------------------------------------------------------------
-- CAR_VERIFICATIONS — same pattern.
-- ---------------------------------------------------------------------
create or replace function public.guard_car_verifications_admin_fields()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public._is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.documents_verified         := false;
    new.documents_verified_at      := null;
    new.documents_verified_by      := null;
    new.ntsa_verified              := false;
    new.ntsa_verified_at           := null;
    new.ntsa_verified_by           := null;
    new.ntsa_notes                 := null;
    new.import_duties_verified     := false;
    new.encumbrance_found          := false;
    new.ownership_mismatch         := false;
    new.document_rejection_reasons := null;
    new.status                     := 'pending';
    new.admin_notes                := null;
    return new;
  end if;

  if old.status in ('verified','rejected') then
    raise exception 'Forbidden: car verification is % — contact support', old.status
      using errcode = '42501';
  end if;

  if new.documents_verified         is distinct from old.documents_verified         then perform public._forbid_admin_field('car_verifications.documents_verified'); end if;
  if new.documents_verified_at      is distinct from old.documents_verified_at      then perform public._forbid_admin_field('car_verifications.documents_verified_at'); end if;
  if new.documents_verified_by      is distinct from old.documents_verified_by      then perform public._forbid_admin_field('car_verifications.documents_verified_by'); end if;
  if new.ntsa_verified              is distinct from old.ntsa_verified              then perform public._forbid_admin_field('car_verifications.ntsa_verified'); end if;
  if new.ntsa_verified_at           is distinct from old.ntsa_verified_at           then perform public._forbid_admin_field('car_verifications.ntsa_verified_at'); end if;
  if new.ntsa_verified_by           is distinct from old.ntsa_verified_by           then perform public._forbid_admin_field('car_verifications.ntsa_verified_by'); end if;
  if new.ntsa_notes                 is distinct from old.ntsa_notes                 then perform public._forbid_admin_field('car_verifications.ntsa_notes'); end if;
  if new.import_duties_verified     is distinct from old.import_duties_verified     then perform public._forbid_admin_field('car_verifications.import_duties_verified'); end if;
  if new.encumbrance_found          is distinct from old.encumbrance_found          then perform public._forbid_admin_field('car_verifications.encumbrance_found'); end if;
  if new.ownership_mismatch         is distinct from old.ownership_mismatch         then perform public._forbid_admin_field('car_verifications.ownership_mismatch'); end if;
  if new.document_rejection_reasons is distinct from old.document_rejection_reasons then perform public._forbid_admin_field('car_verifications.document_rejection_reasons'); end if;
  if new.status                     is distinct from old.status                     then perform public._forbid_admin_field('car_verifications.status'); end if;
  if new.admin_notes                is distinct from old.admin_notes                then perform public._forbid_admin_field('car_verifications.admin_notes'); end if;

  return new;
end $$;

drop trigger if exists trg_guard_cv_admin on public.car_verifications;
create trigger trg_guard_cv_admin
  before insert or update on public.car_verifications
  for each row execute function public.guard_car_verifications_admin_fields();

-- ---------------------------------------------------------------------
-- INSPECTIONS — mechanic fills report; admin approves.
-- Admin-only: admin_reviewed, admin_approved, admin_notes, fee_paid,
-- inspection_fee, fee_currency. Seller cannot write at all
-- (RLS already only grants seller SELECT).
-- ---------------------------------------------------------------------
create or replace function public.guard_inspections_admin_fields()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public._is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.admin_reviewed  := false;
    new.admin_approved  := null;
    new.admin_notes     := null;
    new.fee_paid        := false;
    return new;
  end if;

  if new.admin_reviewed  is distinct from old.admin_reviewed  then perform public._forbid_admin_field('inspections.admin_reviewed'); end if;
  if new.admin_approved  is distinct from old.admin_approved  then perform public._forbid_admin_field('inspections.admin_approved'); end if;
  if new.admin_notes     is distinct from old.admin_notes     then perform public._forbid_admin_field('inspections.admin_notes'); end if;
  if new.fee_paid        is distinct from old.fee_paid        then perform public._forbid_admin_field('inspections.fee_paid'); end if;
  if new.inspection_fee  is distinct from old.inspection_fee  then perform public._forbid_admin_field('inspections.inspection_fee'); end if;
  if new.fee_currency    is distinct from old.fee_currency    then perform public._forbid_admin_field('inspections.fee_currency'); end if;

  return new;
end $$;

drop trigger if exists trg_guard_insp_admin on public.inspections;
create trigger trg_guard_insp_admin
  before insert or update on public.inspections
  for each row execute function public.guard_inspections_admin_fields();

-- ---------------------------------------------------------------------
-- DOCUMENT_RELEASES — buyer can only ACK; everything else is admin.
-- ---------------------------------------------------------------------
create or replace function public.guard_document_releases_admin_fields()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public._is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    raise exception 'Forbidden: only admins may create document releases'
      using errcode = '42501';
  end if;

  -- On UPDATE, buyer may only flip buyer_acknowledged / buyer_acknowledged_at.
  if new.transaction_id      is distinct from old.transaction_id      then perform public._forbid_admin_field('document_releases.transaction_id'); end if;
  if new.car_id              is distinct from old.car_id              then perform public._forbid_admin_field('document_releases.car_id'); end if;
  if new.buyer_id            is distinct from old.buyer_id            then perform public._forbid_admin_field('document_releases.buyer_id'); end if;
  if new.released_by         is distinct from old.released_by         then perform public._forbid_admin_field('document_releases.released_by'); end if;
  if new.documents_released  is distinct from old.documents_released  then perform public._forbid_admin_field('document_releases.documents_released'); end if;
  if new.released_at         is distinct from old.released_at         then perform public._forbid_admin_field('document_releases.released_at'); end if;

  return new;
end $$;

drop trigger if exists trg_guard_dr_admin on public.document_releases;
create trigger trg_guard_dr_admin
  before insert or update on public.document_releases
  for each row execute function public.guard_document_releases_admin_fields();

commit;

