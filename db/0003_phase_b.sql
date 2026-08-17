-- Phase B: Document verification + geolocation

create table if not exists public.car_documents (
  id uuid primary key default gen_random_uuid(),
  car_id uuid not null references public.cars(id) on delete cascade,
  seller_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('title','registration','inspection','export_cert','customs','insurance','other')),
  label text,
  file_path text not null,
  mime_type text,
  size_bytes bigint,
  status text not null default 'pending' check (status in ('pending','verified','rejected')),
  reviewer_id uuid references auth.users(id),
  review_notes text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on public.car_documents to authenticated;
grant all on public.car_documents to service_role;

alter table public.car_documents enable row level security;

drop policy if exists "car_documents_seller_rw" on public.car_documents;
create policy "car_documents_seller_rw" on public.car_documents
  for all to authenticated
  using (seller_id = auth.uid())
  with check (seller_id = auth.uid());

drop policy if exists "car_documents_admin_all" on public.car_documents;
create policy "car_documents_admin_all" on public.car_documents
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "car_documents_public_read_verified" on public.car_documents;
create policy "car_documents_public_read_verified" on public.car_documents
  for select to anon, authenticated
  using (status = 'verified');

create index if not exists car_documents_car_id_idx on public.car_documents(car_id);
create index if not exists car_documents_status_idx on public.car_documents(status);

-- Geolocation on cars
alter table public.cars add column if not exists latitude double precision;
alter table public.cars add column if not exists longitude double precision;

-- Storage bucket for documents (private)
insert into storage.buckets (id, name, public)
values ('car-documents', 'car-documents', false)
on conflict (id) do nothing;

drop policy if exists "car_docs_seller_upload" on storage.objects;
create policy "car_docs_seller_upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'car-documents' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "car_docs_seller_read" on storage.objects;
create policy "car_docs_seller_read" on storage.objects
  for select to authenticated
  using (bucket_id = 'car-documents' and ((storage.foldername(name))[1] = auth.uid()::text or public.has_role(auth.uid(), 'admin')));

drop policy if exists "car_docs_seller_delete" on storage.objects;
create policy "car_docs_seller_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'car-documents' and (storage.foldername(name))[1] = auth.uid()::text);
