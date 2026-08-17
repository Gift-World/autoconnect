-- 0009 — Payment options: full pay / deposit / installments
begin;

alter table public.cars
  add column if not exists pay_full boolean not null default true,
  add column if not exists pay_deposit boolean not null default false,
  add column if not exists pay_installments boolean not null default false,
  add column if not exists deposit_percent numeric(5,2),
  add column if not exists installment_months integer,
  add column if not exists installment_interest_rate numeric(5,2),
  add column if not exists installment_monthly numeric(14,2);

-- Backfill: any existing listing keeps full-pay available.
update public.cars set pay_full = true where pay_full is null;

alter table public.transactions
  add column if not exists payment_plan text
    check (payment_plan in ('full','deposit','installments')),
  add column if not exists plan_amount numeric(14,2),
  add column if not exists plan_notes text;

commit;
