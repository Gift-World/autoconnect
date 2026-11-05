-- AutoConnect sample inventory, generated from src/lib/demo-inventory.ts.
-- Every row is flagged is_sample = true, owned by a clearly named sample seller,
-- carries NO verification flags, and says "Sample listing" in its description.
-- Remove everything with:
--   delete from public.cars where is_sample;  (images cascade)
-- Safe to run more than once.

alter table public.cars add column if not exists is_sample boolean not null default false;

-- Sample seller on the existing preview profile (see 0017_preview_marketplace_seed.sql).
insert into public.sellers (profile_id, business_name, country, city, location_display, is_verified, is_approved, is_suspended, verification_badge, is_dealer)
select 'f98e074f-e3ad-42e6-9a20-80f55e323045', 'AutoConnect Sample Showroom', 'Kenya', 'Nairobi', 'Sample listings for preview', false, true, false, false, true
where exists (select 1 from public.profiles where id = 'f98e074f-e3ad-42e6-9a20-80f55e323045')
  and not exists (select 1 from public.sellers where profile_id = 'f98e074f-e3ad-42e6-9a20-80f55e323045');

insert into public.cars (id, seller_id, title, make_name, model_name, year, price, currency, country, city, location_display, mileage, mileage_unit, transmission, fuel_type, body_type, color, engine_size, condition, description, right_hand_drive, steering_side, available_for_export, shipping_info, import_duties_note, status, featured, views, identity_verified, documents_verified, ntsa_verified, inspection_verified, import_duties_verified, verification_level, pay_full, pay_deposit, pay_installments, deposit_percent, installment_months, installment_interest_rate, installment_monthly, is_sample)
select md5('autoconnect-sample-2021 Toyota Land Cruiser Prado TX-L 2.8D')::uuid, s.id, '2021 Toyota Land Cruiser Prado TX-L 2.8D', 'Toyota', 'Land Cruiser Prado', 2021, 6850000, 'KES', 'Kenya', 'Nairobi', 'Nairobi, Kenya', 42300, 'km', 'automatic', 'diesel', 'suv', 'Pearl White', '2800cc (1GD-FTV)', 'foreign-used', '2021 Toyota Land Cruiser Prado in Pearl White, 42,300 km, automatic, diesel. Sample listing for preview — not for sale. Photos are illustrative.', true, 'right', true, null, null, 'approved', true, 0, false, false, false, false, false, 0, true, true, true, 20, 24, 11.5, 256000, true
from public.sellers s where s.profile_id = 'f98e074f-e3ad-42e6-9a20-80f55e323045'
on conflict (id) do nothing;
insert into public.car_images (car_id, image_url, is_primary, sort_order)
select md5('autoconnect-sample-2021 Toyota Land Cruiser Prado TX-L 2.8D')::uuid, 'https://images.unsplash.com/photo-1594502184342-2e12f877aa73?w=1200&auto=format&fit=crop&q=80', true, 0
where exists (select 1 from public.cars where id = md5('autoconnect-sample-2021 Toyota Land Cruiser Prado TX-L 2.8D')::uuid)
  and not exists (select 1 from public.car_images where car_id = md5('autoconnect-sample-2021 Toyota Land Cruiser Prado TX-L 2.8D')::uuid and image_url = 'https://images.unsplash.com/photo-1594502184342-2e12f877aa73?w=1200&auto=format&fit=crop&q=80');
insert into public.car_images (car_id, image_url, is_primary, sort_order)
select md5('autoconnect-sample-2021 Toyota Land Cruiser Prado TX-L 2.8D')::uuid, 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1200&auto=format&fit=crop&q=80', false, 1
where exists (select 1 from public.cars where id = md5('autoconnect-sample-2021 Toyota Land Cruiser Prado TX-L 2.8D')::uuid)
  and not exists (select 1 from public.car_images where car_id = md5('autoconnect-sample-2021 Toyota Land Cruiser Prado TX-L 2.8D')::uuid and image_url = 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1200&auto=format&fit=crop&q=80');
insert into public.car_images (car_id, image_url, is_primary, sort_order)
select md5('autoconnect-sample-2021 Toyota Land Cruiser Prado TX-L 2.8D')::uuid, 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=1200&auto=format&fit=crop&q=80', false, 2
where exists (select 1 from public.cars where id = md5('autoconnect-sample-2021 Toyota Land Cruiser Prado TX-L 2.8D')::uuid)
  and not exists (select 1 from public.car_images where car_id = md5('autoconnect-sample-2021 Toyota Land Cruiser Prado TX-L 2.8D')::uuid and image_url = 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=1200&auto=format&fit=crop&q=80');
insert into public.car_images (car_id, image_url, is_primary, sort_order)
select md5('autoconnect-sample-2021 Toyota Land Cruiser Prado TX-L 2.8D')::uuid, 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=1200&auto=format&fit=crop&q=80', false, 3
where exists (select 1 from public.cars where id = md5('autoconnect-sample-2021 Toyota Land Cruiser Prado TX-L 2.8D')::uuid)
  and not exists (select 1 from public.car_images where car_id = md5('autoconnect-sample-2021 Toyota Land Cruiser Prado TX-L 2.8D')::uuid and image_url = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=1200&auto=format&fit=crop&q=80');

insert into public.cars (id, seller_id, title, make_name, model_name, year, price, currency, country, city, location_display, mileage, mileage_unit, transmission, fuel_type, body_type, color, engine_size, condition, description, right_hand_drive, steering_side, available_for_export, shipping_info, import_duties_note, status, featured, views, identity_verified, documents_verified, ntsa_verified, inspection_verified, import_duties_verified, verification_level, pay_full, pay_deposit, pay_installments, deposit_percent, installment_months, installment_interest_rate, installment_monthly, is_sample)
select md5('autoconnect-sample-2021 Toyota Harrier Hybrid G-Edition')::uuid, s.id, '2021 Toyota Harrier Hybrid G-Edition', 'Toyota', 'Harrier', 2021, 4450000, 'KES', 'Kenya', 'Nairobi', 'Nairobi, Kenya', 48000, 'km', 'automatic', 'hybrid', 'suv', 'Pearl Crystal White', '2500cc Hybrid (A25A-FXS)', 'foreign-used', '2021 Toyota Harrier in Pearl Crystal White, 48,000 km, automatic, hybrid. Sample listing for preview — not for sale. Photos are illustrative.', true, 'right', true, null, null, 'approved', true, 0, false, false, false, false, false, 0, true, true, true, 25, 18, 12, 162000, true
from public.sellers s where s.profile_id = 'f98e074f-e3ad-42e6-9a20-80f55e323045'
on conflict (id) do nothing;
insert into public.car_images (car_id, image_url, is_primary, sort_order)
select md5('autoconnect-sample-2021 Toyota Harrier Hybrid G-Edition')::uuid, 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=1200&auto=format&fit=crop&q=80', true, 0
where exists (select 1 from public.cars where id = md5('autoconnect-sample-2021 Toyota Harrier Hybrid G-Edition')::uuid)
  and not exists (select 1 from public.car_images where car_id = md5('autoconnect-sample-2021 Toyota Harrier Hybrid G-Edition')::uuid and image_url = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=1200&auto=format&fit=crop&q=80');
insert into public.car_images (car_id, image_url, is_primary, sort_order)
select md5('autoconnect-sample-2021 Toyota Harrier Hybrid G-Edition')::uuid, 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1200&auto=format&fit=crop&q=80', false, 1
where exists (select 1 from public.cars where id = md5('autoconnect-sample-2021 Toyota Harrier Hybrid G-Edition')::uuid)
  and not exists (select 1 from public.car_images where car_id = md5('autoconnect-sample-2021 Toyota Harrier Hybrid G-Edition')::uuid and image_url = 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1200&auto=format&fit=crop&q=80');
insert into public.car_images (car_id, image_url, is_primary, sort_order)
select md5('autoconnect-sample-2021 Toyota Harrier Hybrid G-Edition')::uuid, 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&auto=format&fit=crop&q=80', false, 2
where exists (select 1 from public.cars where id = md5('autoconnect-sample-2021 Toyota Harrier Hybrid G-Edition')::uuid)
  and not exists (select 1 from public.car_images where car_id = md5('autoconnect-sample-2021 Toyota Harrier Hybrid G-Edition')::uuid and image_url = 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&auto=format&fit=crop&q=80');

insert into public.cars (id, seller_id, title, make_name, model_name, year, price, currency, country, city, location_display, mileage, mileage_unit, transmission, fuel_type, body_type, color, engine_size, condition, description, right_hand_drive, steering_side, available_for_export, shipping_info, import_duties_note, status, featured, views, identity_verified, documents_verified, ntsa_verified, inspection_verified, import_duties_verified, verification_level, pay_full, pay_deposit, pay_installments, deposit_percent, installment_months, installment_interest_rate, installment_monthly, is_sample)
select md5('autoconnect-sample-2020 Mercedes-Benz C200 AMG Line')::uuid, s.id, '2020 Mercedes-Benz C200 AMG Line', 'Mercedes-Benz', 'C-Class', 2020, 4800000, 'KES', 'Kenya', 'Nairobi', 'Nairobi, Kenya', 41000, 'km', 'automatic', 'hybrid', 'sedan', 'Iridium Silver Metallic', '1500cc Turbo + 48V Mild Hybrid', 'foreign-used', '2020 Mercedes-Benz C-Class in Iridium Silver Metallic, 41,000 km, automatic, hybrid. Sample listing for preview — not for sale. Photos are illustrative.', true, 'right', true, null, null, 'approved', true, 0, false, false, false, false, false, 0, true, true, true, 20, 24, 11.5, 165000, true
from public.sellers s where s.profile_id = 'f98e074f-e3ad-42e6-9a20-80f55e323045'
on conflict (id) do nothing;
insert into public.car_images (car_id, image_url, is_primary, sort_order)
select md5('autoconnect-sample-2020 Mercedes-Benz C200 AMG Line')::uuid, 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=1200&auto=format&fit=crop&q=80', true, 0
where exists (select 1 from public.cars where id = md5('autoconnect-sample-2020 Mercedes-Benz C200 AMG Line')::uuid)
  and not exists (select 1 from public.car_images where car_id = md5('autoconnect-sample-2020 Mercedes-Benz C200 AMG Line')::uuid and image_url = 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=1200&auto=format&fit=crop&q=80');
insert into public.car_images (car_id, image_url, is_primary, sort_order)
select md5('autoconnect-sample-2020 Mercedes-Benz C200 AMG Line')::uuid, 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=1200&auto=format&fit=crop&q=80', false, 1
where exists (select 1 from public.cars where id = md5('autoconnect-sample-2020 Mercedes-Benz C200 AMG Line')::uuid)
  and not exists (select 1 from public.car_images where car_id = md5('autoconnect-sample-2020 Mercedes-Benz C200 AMG Line')::uuid and image_url = 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=1200&auto=format&fit=crop&q=80');

insert into public.cars (id, seller_id, title, make_name, model_name, year, price, currency, country, city, location_display, mileage, mileage_unit, transmission, fuel_type, body_type, color, engine_size, condition, description, right_hand_drive, steering_side, available_for_export, shipping_info, import_duties_note, status, featured, views, identity_verified, documents_verified, ntsa_verified, inspection_verified, import_duties_verified, verification_level, pay_full, pay_deposit, pay_installments, deposit_percent, installment_months, installment_interest_rate, installment_monthly, is_sample)
select md5('autoconnect-sample-2021 BMW 530i M Sport')::uuid, s.id, '2021 BMW 530i M Sport', 'BMW', '5 Series', 2021, 5400000, 'KES', 'Kenya', 'Nairobi', 'Nairobi, Kenya', 38000, 'km', 'automatic', 'petrol', 'sedan', 'Phytonic Blue Metallic', '2000cc TwinPower Turbo (248 HP)', 'foreign-used', '2021 BMW 5 Series in Phytonic Blue Metallic, 38,000 km, automatic, petrol. Sample listing for preview — not for sale. Photos are illustrative.', true, 'right', true, null, null, 'approved', true, 0, false, false, false, false, false, 0, true, true, true, 20, 24, 11.5, 198000, true
from public.sellers s where s.profile_id = 'f98e074f-e3ad-42e6-9a20-80f55e323045'
on conflict (id) do nothing;
insert into public.car_images (car_id, image_url, is_primary, sort_order)
select md5('autoconnect-sample-2021 BMW 530i M Sport')::uuid, 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1200&auto=format&fit=crop&q=80', true, 0
where exists (select 1 from public.cars where id = md5('autoconnect-sample-2021 BMW 530i M Sport')::uuid)
  and not exists (select 1 from public.car_images where car_id = md5('autoconnect-sample-2021 BMW 530i M Sport')::uuid and image_url = 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1200&auto=format&fit=crop&q=80');

insert into public.cars (id, seller_id, title, make_name, model_name, year, price, currency, country, city, location_display, mileage, mileage_unit, transmission, fuel_type, body_type, color, engine_size, condition, description, right_hand_drive, steering_side, available_for_export, shipping_info, import_duties_note, status, featured, views, identity_verified, documents_verified, ntsa_verified, inspection_verified, import_duties_verified, verification_level, pay_full, pay_deposit, pay_installments, deposit_percent, installment_months, installment_interest_rate, installment_monthly, is_sample)
select md5('autoconnect-sample-2021 Toyota Hilux Double Cab 2.8 GD-6 4x4')::uuid, s.id, '2021 Toyota Hilux Double Cab 2.8 GD-6 4x4', 'Toyota', 'Hilux', 2021, 4600000, 'KES', 'Kenya', 'Nakuru', 'Nakuru, Kenya', 52000, 'km', 'automatic', 'diesel', 'pickup', 'Attitude Black Mica', '2800cc Turbo Diesel (500 Nm)', 'locally-used', '2021 Toyota Hilux in Attitude Black Mica, 52,000 km, automatic, diesel. Sample listing for preview — not for sale. Photos are illustrative.', true, 'right', true, null, null, 'approved', true, 0, false, false, false, false, false, 0, true, true, true, 20, 24, 11.5, 172000, true
from public.sellers s where s.profile_id = 'f98e074f-e3ad-42e6-9a20-80f55e323045'
on conflict (id) do nothing;
insert into public.car_images (car_id, image_url, is_primary, sort_order)
select md5('autoconnect-sample-2021 Toyota Hilux Double Cab 2.8 GD-6 4x4')::uuid, 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1200&auto=format&fit=crop&q=80', true, 0
where exists (select 1 from public.cars where id = md5('autoconnect-sample-2021 Toyota Hilux Double Cab 2.8 GD-6 4x4')::uuid)
  and not exists (select 1 from public.car_images where car_id = md5('autoconnect-sample-2021 Toyota Hilux Double Cab 2.8 GD-6 4x4')::uuid and image_url = 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1200&auto=format&fit=crop&q=80');

insert into public.cars (id, seller_id, title, make_name, model_name, year, price, currency, country, city, location_display, mileage, mileage_unit, transmission, fuel_type, body_type, color, engine_size, condition, description, right_hand_drive, steering_side, available_for_export, shipping_info, import_duties_note, status, featured, views, identity_verified, documents_verified, ntsa_verified, inspection_verified, import_duties_verified, verification_level, pay_full, pay_deposit, pay_installments, deposit_percent, installment_months, installment_interest_rate, installment_monthly, is_sample)
select md5('autoconnect-sample-2022 Ford Ranger Wildtrak 2.0 Bi-Turbo 4x4')::uuid, s.id, '2022 Ford Ranger Wildtrak 2.0 Bi-Turbo 4x4', 'Ford', 'Ranger', 2022, 4950000, 'KES', 'Kenya', 'Nairobi', 'Nairobi, Kenya', 36000, 'km', 'automatic', 'diesel', 'pickup', 'Pride Orange Metallic', '2000cc Bi-Turbo Diesel (210 HP)', 'foreign-used', '2022 Ford Ranger in Pride Orange Metallic, 36,000 km, automatic, diesel. Sample listing for preview — not for sale. Photos are illustrative.', true, 'right', true, null, null, 'approved', true, 0, false, false, false, false, false, 0, true, true, true, 20, 24, 11.5, 184000, true
from public.sellers s where s.profile_id = 'f98e074f-e3ad-42e6-9a20-80f55e323045'
on conflict (id) do nothing;
insert into public.car_images (car_id, image_url, is_primary, sort_order)
select md5('autoconnect-sample-2022 Ford Ranger Wildtrak 2.0 Bi-Turbo 4x4')::uuid, 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1200&auto=format&fit=crop&q=80', true, 0
where exists (select 1 from public.cars where id = md5('autoconnect-sample-2022 Ford Ranger Wildtrak 2.0 Bi-Turbo 4x4')::uuid)
  and not exists (select 1 from public.car_images where car_id = md5('autoconnect-sample-2022 Ford Ranger Wildtrak 2.0 Bi-Turbo 4x4')::uuid and image_url = 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1200&auto=format&fit=crop&q=80');

insert into public.cars (id, seller_id, title, make_name, model_name, year, price, currency, country, city, location_display, mileage, mileage_unit, transmission, fuel_type, body_type, color, engine_size, condition, description, right_hand_drive, steering_side, available_for_export, shipping_info, import_duties_note, status, featured, views, identity_verified, documents_verified, ntsa_verified, inspection_verified, import_duties_verified, verification_level, pay_full, pay_deposit, pay_installments, deposit_percent, installment_months, installment_interest_rate, installment_monthly, is_sample)
select md5('autoconnect-sample-2020 Mercedes-Benz E300 AMG Line')::uuid, s.id, '2020 Mercedes-Benz E300 AMG Line', 'Mercedes-Benz', 'E-Class', 2020, 5800000, 'KES', 'Kenya', 'Nairobi', 'Nairobi, Kenya', 41000, 'km', 'automatic', 'petrol', 'sedan', 'Obsidian Black Metallic', '2000cc Turbo (255 HP)', 'foreign-used', '2020 Mercedes-Benz E-Class in Obsidian Black Metallic, 41,000 km, automatic, petrol. Sample listing for preview — not for sale. Photos are illustrative.', true, 'right', true, null, null, 'approved', true, 0, false, false, false, false, false, 0, true, true, true, 20, 24, 11.5, 215000, true
from public.sellers s where s.profile_id = 'f98e074f-e3ad-42e6-9a20-80f55e323045'
on conflict (id) do nothing;
insert into public.car_images (car_id, image_url, is_primary, sort_order)
select md5('autoconnect-sample-2020 Mercedes-Benz E300 AMG Line')::uuid, 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=1200&auto=format&fit=crop&q=80', true, 0
where exists (select 1 from public.cars where id = md5('autoconnect-sample-2020 Mercedes-Benz E300 AMG Line')::uuid)
  and not exists (select 1 from public.car_images where car_id = md5('autoconnect-sample-2020 Mercedes-Benz E300 AMG Line')::uuid and image_url = 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=1200&auto=format&fit=crop&q=80');

insert into public.cars (id, seller_id, title, make_name, model_name, year, price, currency, country, city, location_display, mileage, mileage_unit, transmission, fuel_type, body_type, color, engine_size, condition, description, right_hand_drive, steering_side, available_for_export, shipping_info, import_duties_note, status, featured, views, identity_verified, documents_verified, ntsa_verified, inspection_verified, import_duties_verified, verification_level, pay_full, pay_deposit, pay_installments, deposit_percent, installment_months, installment_interest_rate, installment_monthly, is_sample)
select md5('autoconnect-sample-2020 Subaru Outback 2.5i Limited EyeSight')::uuid, s.id, '2020 Subaru Outback 2.5i Limited EyeSight', 'Subaru', 'Outback', 2020, 3650000, 'KES', 'Kenya', 'Nairobi', 'Nairobi, Kenya', 49800, 'km', 'automatic', 'petrol', 'wagon', 'Tungsten Metallic', '2500cc Boxer', 'foreign-used', '2020 Subaru Outback in Tungsten Metallic, 49,800 km, automatic, petrol. Sample listing for preview — not for sale. Photos are illustrative.', true, 'right', true, null, null, 'approved', true, 0, false, false, false, false, false, 0, true, true, true, 20, 24, 11.5, 138000, true
from public.sellers s where s.profile_id = 'f98e074f-e3ad-42e6-9a20-80f55e323045'
on conflict (id) do nothing;
insert into public.car_images (car_id, image_url, is_primary, sort_order)
select md5('autoconnect-sample-2020 Subaru Outback 2.5i Limited EyeSight')::uuid, 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=1200&auto=format&fit=crop&q=80', true, 0
where exists (select 1 from public.cars where id = md5('autoconnect-sample-2020 Subaru Outback 2.5i Limited EyeSight')::uuid)
  and not exists (select 1 from public.car_images where car_id = md5('autoconnect-sample-2020 Subaru Outback 2.5i Limited EyeSight')::uuid and image_url = 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=1200&auto=format&fit=crop&q=80');
insert into public.car_images (car_id, image_url, is_primary, sort_order)
select md5('autoconnect-sample-2020 Subaru Outback 2.5i Limited EyeSight')::uuid, 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1200&auto=format&fit=crop&q=80', false, 1
where exists (select 1 from public.cars where id = md5('autoconnect-sample-2020 Subaru Outback 2.5i Limited EyeSight')::uuid)
  and not exists (select 1 from public.car_images where car_id = md5('autoconnect-sample-2020 Subaru Outback 2.5i Limited EyeSight')::uuid and image_url = 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1200&auto=format&fit=crop&q=80');
insert into public.car_images (car_id, image_url, is_primary, sort_order)
select md5('autoconnect-sample-2020 Subaru Outback 2.5i Limited EyeSight')::uuid, 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=1200&auto=format&fit=crop&q=80', false, 2
where exists (select 1 from public.cars where id = md5('autoconnect-sample-2020 Subaru Outback 2.5i Limited EyeSight')::uuid)
  and not exists (select 1 from public.car_images where car_id = md5('autoconnect-sample-2020 Subaru Outback 2.5i Limited EyeSight')::uuid and image_url = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=1200&auto=format&fit=crop&q=80');

insert into public.cars (id, seller_id, title, make_name, model_name, year, price, currency, country, city, location_display, mileage, mileage_unit, transmission, fuel_type, body_type, color, engine_size, condition, description, right_hand_drive, steering_side, available_for_export, shipping_info, import_duties_note, status, featured, views, identity_verified, documents_verified, ntsa_verified, inspection_verified, import_duties_verified, verification_level, pay_full, pay_deposit, pay_installments, deposit_percent, installment_months, installment_interest_rate, installment_monthly, is_sample)
select md5('autoconnect-sample-2020 Mazda CX-5 2.2D AWD Exclusive-Mode')::uuid, s.id, '2020 Mazda CX-5 2.2D AWD Exclusive-Mode', 'Mazda', 'CX-5', 2020, 3450000, 'KES', 'Kenya', 'Nairobi', 'Nairobi, Kenya', 38200, 'km', 'automatic', 'diesel', 'suv', 'Soul Red Crystal', '2200cc SkyActiv-D', 'foreign-used', '2020 Mazda CX-5 in Soul Red Crystal, 38,200 km, automatic, diesel. Sample listing for preview — not for sale. Photos are illustrative.', true, 'right', true, null, null, 'approved', true, 0, false, false, false, false, false, 0, true, true, true, 25, 18, 12, 162000, true
from public.sellers s where s.profile_id = 'f98e074f-e3ad-42e6-9a20-80f55e323045'
on conflict (id) do nothing;
insert into public.car_images (car_id, image_url, is_primary, sort_order)
select md5('autoconnect-sample-2020 Mazda CX-5 2.2D AWD Exclusive-Mode')::uuid, 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1200&auto=format&fit=crop&q=80', true, 0
where exists (select 1 from public.cars where id = md5('autoconnect-sample-2020 Mazda CX-5 2.2D AWD Exclusive-Mode')::uuid)
  and not exists (select 1 from public.car_images where car_id = md5('autoconnect-sample-2020 Mazda CX-5 2.2D AWD Exclusive-Mode')::uuid and image_url = 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1200&auto=format&fit=crop&q=80');
insert into public.car_images (car_id, image_url, is_primary, sort_order)
select md5('autoconnect-sample-2020 Mazda CX-5 2.2D AWD Exclusive-Mode')::uuid, 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&auto=format&fit=crop&q=80', false, 1
where exists (select 1 from public.cars where id = md5('autoconnect-sample-2020 Mazda CX-5 2.2D AWD Exclusive-Mode')::uuid)
  and not exists (select 1 from public.car_images where car_id = md5('autoconnect-sample-2020 Mazda CX-5 2.2D AWD Exclusive-Mode')::uuid and image_url = 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&auto=format&fit=crop&q=80');
insert into public.car_images (car_id, image_url, is_primary, sort_order)
select md5('autoconnect-sample-2020 Mazda CX-5 2.2D AWD Exclusive-Mode')::uuid, 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1200&auto=format&fit=crop&q=80', false, 2
where exists (select 1 from public.cars where id = md5('autoconnect-sample-2020 Mazda CX-5 2.2D AWD Exclusive-Mode')::uuid)
  and not exists (select 1 from public.car_images where car_id = md5('autoconnect-sample-2020 Mazda CX-5 2.2D AWD Exclusive-Mode')::uuid and image_url = 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1200&auto=format&fit=crop&q=80');

