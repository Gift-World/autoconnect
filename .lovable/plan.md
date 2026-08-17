
## What I'll ship

### 1. Payment options (Full · Deposit · Installments)

**DB migration `0009_payment_options.sql`**
- On `cars`: add `pay_full boolean`, `pay_deposit boolean`, `pay_installments boolean`, `deposit_percent numeric`, `installment_months int`, `installment_interest_rate numeric`, `installment_monthly numeric` (nullable — computed if not set).
- Default `pay_full = true` for all existing listings (backfill so nothing breaks).
- Add admin-only lock trigger already covers status; new columns are seller-editable while pending.
- On `transactions`: add `payment_plan text CHECK IN ('full','deposit','installments')`, `plan_amount numeric` (what buyer actually paid now), `plan_notes text`.

**Seller listing form (`seller.listings.new.tsx`)**
- New "Payment options" section with 3 checkboxes: Full payment · Deposit (reserve) · Monthly installments.
- If Deposit checked → deposit % input (default 20%).
- If Installments checked → months + interest rate + optional monthly override; live preview of monthly.
- At least one must be selected.

**Car detail BuyBox (`cars.$id.tsx`)**
- Show tabs/segmented control for whichever options the seller enabled.
- Full = full price + 5% fee. Deposit = deposit + 5% fee (rest owed offline/next step). Installments = shows plan breakdown, first month + 5% fee.
- Pass `payment_plan` into CheckoutModal → payments.functions.ts records it on transaction.

**Admin**
- `admin.listings.tsx`: badge chips showing enabled payment options per listing.
- `admin.transactions.tsx`: show `payment_plan` column + amount paid.

### 2. Inspection MVP workflow

Reuses existing `inspections` table. One additive migration:

**DB migration `0010_inspection_checklist.sql`**
- Add `checklist jsonb` (holds all detailed items — mechanical/electrical/body/tyres/extras — flexible, no schema explosion).
- Add `buyer_summary text` (safe public summary).
- Add `photos_urls text[]` (inspection photos, reuse `inspection-photos` bucket).
- Add `requested_by uuid` + `requested_at timestamptz`.
- Add index on `car_id` + status.

**Seller**: `seller.inspections.tsx` (new)
- List of own inspections + "Request inspection" button per listing → creates pending row.

**Admin**: `admin.inspections.tsx` (new)
- Full queue. Assign mechanic (dropdown from `mechanics`), set date/location, or fill inspection directly.
- Approve → sets `cars.inspection_verified = true` (admin trigger already permits this).

**Inspection form** (`admin.inspections.$id.tsx` — reusable, mechanic-accessible)
- Full checklist grouped into 5 sections:
  - Mechanical: starts, road tested, gears smooth, steering vibration, turning clunks, braking, handbrake incline, bumpy-road knocks, leaks, unusual engine noise.
  - Electrical: lights/full beam, indicators, hazards, radio, windows, AC/heater, central locking, interior lights, mirrors.
  - Body: exterior dents/scratches, interior, roof, dashboard, seats, boot.
  - Tyres: spare tyre presence, make, size, condition, spare condition.
  - Extras: jack, wheel spanner, spare key, reverse camera, mats, other.
- Final: verdict (Pass/Conditional/Fail), overall score 1–10, buyer summary (safe), internal notes, photo uploads.

**Buyer car detail**
- Shows only `buyer_summary`, verdict badge, overall score, and photo thumbnails when `inspection_verified = true`. No internal notes, no per-item admin details.

**Nav**
- Add `Inspections` link to seller + admin dashboards.

### 3. Error attached

I don't see a screenshot in this turn — please re-attach or paste the error text and I'll fix it in the same batch. I'll ship the two features above regardless.

---

**Files I'll touch/create**
- `db/0009_payment_options.sql`, `db/0010_inspection_checklist.sql`
- `src/routes/_authenticated/seller.listings.new.tsx` (payment section)
- `src/routes/cars.$id.tsx` (BuyBox with plan tabs + inspection summary panel)
- `src/components/payments/CheckoutModal.tsx` (accept plan)
- `src/lib/payments.functions.ts` (record plan on tx)
- `src/routes/_authenticated/admin.listings.tsx` (payment badges)
- `src/routes/_authenticated/admin.transactions.tsx` (plan column)
- New: `src/routes/_authenticated/seller.inspections.tsx`, `admin.inspections.tsx`, `admin.inspections.$id.tsx`
- `src/routes/_authenticated/seller.tsx`, `admin.tsx` (nav links)

Reply **go** and I'll build all of it in one pass.

