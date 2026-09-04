-- Safe preview-only marketplace data. These records are deliberately marked
-- as samples and can be replaced through the normal supplier onboarding flow.
-- The owner is an existing preview profile, never a customer profile.

insert into public.parts_shops (owner_id, slug, name, description, country, city, phone, shipping_regions, return_policy, is_verified, is_approved, is_suspended, is_sample)
values
  ('f98e074f-e3ad-42e6-9a20-80f55e323045', 'nairobi-parts', 'Nairobi Genuine Parts Hub', 'Sample verified supplier for preview testing.', 'Kenya', 'Nairobi', '+254700000101', array['Kenya','Uganda','Tanzania'], 'Confirm fitment before purchase.', true, true, false, true),
  ('f98e074f-e3ad-42e6-9a20-80f55e323045', 'yokohama-parts', 'Yokohama Export Parts', 'Sample international supplier for preview testing.', 'Japan', 'Yokohama', '+81450000102', array['Kenya','East Africa','Worldwide'], 'Supplier confirms freight and fitment.', true, true, false, true),
  ('f98e074f-e3ad-42e6-9a20-80f55e323045', 'dubai-parts', 'Dubai Auto Components', 'Sample export supplier for preview testing.', 'United Arab Emirates', 'Dubai', '+971500000103', array['Kenya','Africa','Worldwide'], 'Quote confirms availability and fitment.', true, true, false, true)
on conflict (slug) do update set is_approved = true, is_suspended = false;

insert into public.parts (shop_id, title, brand, part_number, category, condition, description, price, currency, country, city, stock_quantity, shipping_regions, warranty_text, return_policy, status, is_sample)
select s.id, v.title, v.brand, v.part_number, v.category, 'new', v.description, v.price, v.currency, v.country, v.city, v.stock_quantity, v.shipping_regions, v.warranty_text, 'Terms supplied in quote.', 'published', true
from (values
  ('nairobi-parts', 'Prado Front Brake Disc Pair', 'Toyota', '43512-0K040', 'Brakes', 'Sample OEM-style front brake disc pair. Confirm VIN before ordering.', 18500::numeric, 'KES', 'Kenya', 'Nairobi', 12, array['Kenya','Uganda']::text[], '6-month sample warranty'),
  ('yokohama-parts', 'RAV4 Hybrid Inverter Coolant Pump', 'Toyota', 'G9040-42030', 'Hybrid & EV', 'Sample export catalogue item. Compatibility is confirmed from VIN.', 16800::numeric, 'USD', 'Japan', 'Yokohama', 6, array['Kenya','East Africa','Worldwide']::text[], '90-day sample warranty'),
  ('dubai-parts', 'Universal Dash Camera Kit', 'RoadView', 'RV-4K-DASH', 'Accessories', 'Sample 4K dash camera with installation accessories.', 145::numeric, 'USD', 'United Arab Emirates', 'Dubai', 18, array['Kenya','Africa','Worldwide']::text[], '12-month sample warranty')
) as v(slug, title, brand, part_number, category, description, price, currency, country, city, stock_quantity, shipping_regions, warranty_text)
join public.parts_shops s on s.slug = v.slug
where not exists (select 1 from public.parts p where p.part_number = v.part_number);

insert into public.garage_vehicles (owner_id, nickname, make_name, model_name, year, vin, mileage, mileage_unit, next_service_at, next_service_mileage, insurance_renews_at, notes)
select 'f98e074f-e3ad-42e6-9a20-80f55e323045', 'Family Prado', 'Toyota', 'Land Cruiser Prado', 2019, 'PREVIEW-PRADO-2019', 68400, 'km', '2026-11-15', 75000, '2027-03-01', 'Sample preview vehicle; replace after sign-in.'
where not exists (select 1 from public.garage_vehicles where vin = 'PREVIEW-PRADO-2019');

insert into public.garage_vehicles (owner_id, nickname, make_name, model_name, year, vin, mileage, mileage_unit, next_service_at, next_service_mileage, insurance_renews_at, notes)
select 'f98e074f-e3ad-42e6-9a20-80f55e323045', 'City X-Trail', 'Nissan', 'X-Trail 20Xi', 2019, 'PREVIEW-XTRAIL-2019', 59200, 'km', '2026-10-22', 65000, '2027-01-18', 'Sample preview service milestones.'
where not exists (select 1 from public.garage_vehicles where vin = 'PREVIEW-XTRAIL-2019');

insert into public.service_providers (owner_id, name, provider_type, country, city, description, phone, is_verified, is_approved)
select 'f98e074f-e3ad-42e6-9a20-80f55e323045', v.name, v.provider_type, 'Kenya', 'Nairobi', v.description, v.phone, true, true
from (values
  ('TorqueLab Nairobi', 'mechanic', 'Sample mechanic for diagnostics, brakes and maintenance.', '+254700000201'),
  ('Apex Auto Care', 'garage', 'Sample full-service garage for inspection and repairs.', '+254700000202'),
  ('Hybrid Motion Clinic', 'garage', 'Sample hybrid and EV specialist workshop.', '+254700000203'),
  ('RoadReady Inspection', 'inspection', 'Sample pre-purchase inspection provider.', '+254700000204')
) as v(name, provider_type, description, phone)
where not exists (select 1 from public.service_providers p where p.name = v.name and p.city = 'Nairobi');

-- Public catalogue reads are restricted to approved businesses. The garage
-- preview policy exposes only its explicitly-labelled test records.
create policy "preview garage sample readable" on public.garage_vehicles
  for select to anon, authenticated
  using (owner_id = 'f98e074f-e3ad-42e6-9a20-80f55e323045'::uuid);

create policy "public approved parts shops" on public.parts_shops
  for select to anon, authenticated
  using (is_approved = true and is_suspended = false);

create policy "public approved service providers" on public.service_providers
  for select to anon, authenticated
  using (is_approved = true);
