-- Provider activation is deliberately a claim-and-review flow. A signed-in
-- person may request a provider record, but only an administrator can attach
-- that record to their account and unlock its booking inbox.
begin;

create table if not exists public.service_provider_claims (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.service_providers(id) on delete cascade,
  claimant_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'requested' check (status in ('requested', 'approved', 'rejected')),
  note text check (char_length(note) <= 1000),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (provider_id, claimant_id)
);

create unique index if not exists service_provider_one_open_claim_idx
  on public.service_provider_claims(provider_id) where status = 'requested';
create index if not exists service_provider_claims_claimant_idx
  on public.service_provider_claims(claimant_id, created_at desc);

grant select, insert on public.service_provider_claims to authenticated;
grant all on public.service_provider_claims to service_role;
alter table public.service_provider_claims enable row level security;

create policy "service_provider_claims_claimant_read" on public.service_provider_claims
  for select to authenticated using (claimant_id = auth.uid());
create policy "service_provider_claims_claimant_request" on public.service_provider_claims
  for insert to authenticated with check (
    claimant_id = auth.uid()
    and exists (
      select 1 from public.service_providers p
      where p.id = provider_id and p.owner_id is null and p.is_approved = true
    )
  );
create policy "service_provider_claims_admin_all" on public.service_provider_claims
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create or replace function public.resolve_service_provider_claim(
  p_claim_id uuid,
  p_approve boolean
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_claim public.service_provider_claims;
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'Only administrators can resolve provider claims';
  end if;

  select * into v_claim from public.service_provider_claims where id = p_claim_id for update;
  if not found or v_claim.status <> 'requested' then
    raise exception 'This claim is no longer awaiting review';
  end if;

  if p_approve then
    update public.service_providers
      set owner_id = v_claim.claimant_id, updated_at = now()
      where id = v_claim.provider_id and owner_id is null;
    if not found then
      raise exception 'This provider is already linked to another account';
    end if;
    update public.service_provider_claims
      set status = 'approved', reviewed_by = auth.uid(), reviewed_at = now()
      where id = v_claim.id;
    update public.service_provider_claims
      set status = 'rejected', reviewed_by = auth.uid(), reviewed_at = now()
      where provider_id = v_claim.provider_id and id <> v_claim.id and status = 'requested';
  else
    update public.service_provider_claims
      set status = 'rejected', reviewed_by = auth.uid(), reviewed_at = now()
      where id = v_claim.id;
  end if;
end;
$$;

revoke all on function public.resolve_service_provider_claim(uuid, boolean) from public;
grant execute on function public.resolve_service_provider_claim(uuid, boolean) to authenticated;

commit;
