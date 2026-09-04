-- 0016 — Parts marketplace MVP: sample catalogue and real buyer enquiries.
-- Sample items are visibly marked in the product UI. Replace them with verified
-- supplier inventory before public launch.

begin;

alter table public.parts_shops add column if not exists is_sample boolean not null default false;
alter table public.parts add column if not exists is_sample boolean not null default false;

create table if not exists public.part_inquiries (
  id uuid primary key default gen_random_uuid(),
  part_id uuid not null references public.parts(id) on delete cascade,
  shop_id uuid not null references public.parts_shops(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  quantity integer not null default 1 check (quantity > 0),
  destination_country text,
  message text not null check (char_length(message) between 5 and 2000),
  status text not null default 'new' check (status in ('new', 'quoted', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists part_inquiries_buyer_idx on public.part_inquiries(buyer_id, created_at desc);
create index if not exists part_inquiries_shop_idx on public.part_inquiries(shop_id, created_at desc);
grant select, insert on public.part_inquiries to authenticated;
grant update on public.part_inquiries to authenticated;
grant all on public.part_inquiries to service_role;
alter table public.part_inquiries enable row level security;
create policy "part_inquiries_buyer_read" on public.part_inquiries for select to authenticated using (buyer_id = auth.uid());
create policy "part_inquiries_buyer_insert" on public.part_inquiries for insert to authenticated with check (buyer_id = auth.uid());
create policy "part_inquiries_shop_read" on public.part_inquiries for select to authenticated using (shop_id in (select id from public.parts_shops where owner_id = auth.uid()));
create policy "part_inquiries_shop_update" on public.part_inquiries for update to authenticated using (shop_id in (select id from public.parts_shops where owner_id = auth.uid())) with check (shop_id in (select id from public.parts_shops where owner_id = auth.uid()));
create policy "part_inquiries_admin_all" on public.part_inquiries for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
drop trigger if exists part_inquiries_set_updated_at on public.part_inquiries;
create trigger part_inquiries_set_updated_at before update on public.part_inquiries for each row execute function public.set_updated_at();

-- Seed only when an administrator profile exists. These are labelled sample
-- catalogue records, not real suppliers or stock claims.
with owner_profile as (
  select id from public.profiles where role = 'admin' order by created_at limit 1
)
insert into public.parts_shops (owner_id, slug, name, description, country, city, shipping_regions, is_approved, is_sample)
select id, 'autoconnect-sample-parts', 'AutoConnect Sample Parts', 'Illustrative catalogue data for marketplace testing. Not a live supplier.', 'KE', 'Nairobi', array['KE', 'UG', 'TZ'], true, true
from owner_profile
on conflict (slug) do update set is_sample = true, is_approved = true;

insert into public.parts (shop_id, title, brand, part_number, category, condition, price, currency, country, city, stock_quantity, shipping_regions, warranty_text, status, is_sample)
select shop.id, item.title, item.brand, item.part_number, item.category, item.condition, item.price, 'KES', 'KE', 'Nairobi', item.stock, array['KE', 'UG', 'TZ'], item.warranty, 'published', true
from public.parts_shops shop
cross join (values
  ('Front Brake Pad Set', 'Toyota Genuine', '04465-0K240', 'Brakes', 'new', 14500::numeric, 12, '12-month supplier warranty'),
  ('Engine Oil Filter', 'Mann Filter', 'W 712/95', 'Engine', 'new', 2100::numeric, 30, 'Fitment confirmation before dispatch'),
  ('LED Headlamp Assembly', 'Koito', '81150-0K680', 'Lighting', 'refurbished', 38500::numeric, 4, '90-day functional warranty'),
  ('Front Shock Absorber', 'KYB', '339701', 'Suspension', 'new', 18600::numeric, 8, '12-month manufacturer warranty'),
  ('Hybrid Battery Cooling Fan', 'Toyota Genuine', 'G92C0-47030', 'Hybrid & EV', 'used', 22000::numeric, 2, '30-day exchange warranty'),
  ('All-terrain Tyre 265/65 R17', 'BFGoodrich', 'KO2-26565R17', 'Tyres & Wheels', 'new', 46800::numeric, 10, 'Manufacturer warranty applies')
) as item(title, brand, part_number, category, condition, price, stock, warranty)
where shop.slug = 'autoconnect-sample-parts'
  and not exists (select 1 from public.parts existing where existing.shop_id = shop.id and existing.part_number = item.part_number);

commit;
