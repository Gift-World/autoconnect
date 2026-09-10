-- Keep an auditable record of which version of the marketplace rules a member accepted.
create table if not exists public.user_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_type text not null check (document_type in ('terms', 'privacy', 'auction_rules', 'seller_rules', 'payment_rules')),
  document_version text not null,
  accepted_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  unique (user_id, document_type, document_version)
);

alter table public.user_consents enable row level security;

drop policy if exists "members can read their own consent records" on public.user_consents;
create policy "members can read their own consent records"
  on public.user_consents for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "members can record their own consent" on public.user_consents;
create policy "members can record their own consent"
  on public.user_consents for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "admins can read consent records" on public.user_consents;
create policy "admins can read consent records"
  on public.user_consents for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));
