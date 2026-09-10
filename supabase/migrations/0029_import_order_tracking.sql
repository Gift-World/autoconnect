-- Import purchases are separate from a sourcing request. Every visible field
-- is entered from the order, carrier or clearing record — not generated copy.
create table if not exists public.import_orders (
  id uuid primary key default gen_random_uuid(),
  order_reference text not null unique,
  buyer_id uuid not null references auth.users(id),
  seller_id uuid references public.sellers(id),
  car_id uuid references public.cars(id) on delete set null,
  import_request_id uuid references public.import_requests(id) on delete set null,
  status text not null default 'reserved' check (status in ('reserved', 'proforma_issued', 'payment_pending', 'payment_verified', 'preparing', 'in_transit', 'at_port', 'clearing', 'ready_for_handover', 'completed', 'cancelled')),
  origin_country text,
  origin_port text,
  destination_country text,
  destination_port text,
  shipping_method text,
  carrier_name text,
  vessel_name text,
  booking_reference text,
  etd date,
  eta date,
  proforma_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.import_order_milestones (
  id uuid primary key default gen_random_uuid(),
  import_order_id uuid not null references public.import_orders(id) on delete cascade,
  stage_code text not null check (stage_code in ('reserved', 'proforma_issued', 'payment_verified', 'preparing', 'loaded', 'in_transit', 'arrived', 'clearing', 'ready_for_handover', 'completed')),
  title text not null,
  status text not null default 'upcoming' check (status in ('upcoming', 'active', 'completed', 'delayed')),
  occurred_at timestamptz,
  location text,
  note text,
  source text check (source in ('seller', 'carrier', 'clearing_agent', 'autoconnect', 'buyer')),
  created_at timestamptz not null default now(),
  unique(import_order_id, stage_code)
);

create table if not exists public.import_order_documents (
  id uuid primary key default gen_random_uuid(),
  import_order_id uuid not null references public.import_orders(id) on delete cascade,
  document_type text not null check (document_type in ('proforma_invoice', 'bill_of_lading', 'export_certificate', 'inspection_certificate', 'insurance_certificate', 'customs_entry', 'delivery_note', 'other')),
  title text not null,
  file_path text,
  external_url text,
  status text not null default 'available' check (status in ('requested', 'available', 'verified', 'rejected')),
  created_at timestamptz not null default now()
);

alter table public.import_orders enable row level security;
alter table public.import_order_milestones enable row level security;
alter table public.import_order_documents enable row level security;

create policy "buyers can read their import orders" on public.import_orders for select to authenticated using (buyer_id = auth.uid());
create policy "buyers can read their import milestones" on public.import_order_milestones for select to authenticated using (exists (select 1 from public.import_orders order_row where order_row.id = import_order_milestones.import_order_id and order_row.buyer_id = auth.uid()));
create policy "buyers can read their import documents" on public.import_order_documents for select to authenticated using (exists (select 1 from public.import_orders order_row where order_row.id = import_order_documents.import_order_id and order_row.buyer_id = auth.uid()));

create policy "sellers can read their import orders" on public.import_orders for select to authenticated using (exists (select 1 from public.sellers seller where seller.id = import_orders.seller_id and seller.profile_id = auth.uid()));
create policy "sellers can update their import orders" on public.import_orders for update to authenticated using (exists (select 1 from public.sellers seller where seller.id = import_orders.seller_id and seller.profile_id = auth.uid())) with check (exists (select 1 from public.sellers seller where seller.id = import_orders.seller_id and seller.profile_id = auth.uid()));
create policy "sellers can manage their import milestones" on public.import_order_milestones for all to authenticated using (exists (select 1 from public.import_orders order_row join public.sellers seller on seller.id = order_row.seller_id where order_row.id = import_order_milestones.import_order_id and seller.profile_id = auth.uid())) with check (exists (select 1 from public.import_orders order_row join public.sellers seller on seller.id = order_row.seller_id where order_row.id = import_order_milestones.import_order_id and seller.profile_id = auth.uid()));
create policy "sellers can manage their import documents" on public.import_order_documents for all to authenticated using (exists (select 1 from public.import_orders order_row join public.sellers seller on seller.id = order_row.seller_id where order_row.id = import_order_documents.import_order_id and seller.profile_id = auth.uid())) with check (exists (select 1 from public.import_orders order_row join public.sellers seller on seller.id = order_row.seller_id where order_row.id = import_order_documents.import_order_id and seller.profile_id = auth.uid()));

create policy "admins can manage import orders" on public.import_orders for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "admins can manage import milestones" on public.import_order_milestones for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "admins can manage import documents" on public.import_order_documents for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
