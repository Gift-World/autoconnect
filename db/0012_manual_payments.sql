-- 0012 — Manual payment / reservation (M-Pesa, bank transfer) + handover tracking
begin;

alter table public.transactions
  add column if not exists payment_method text not null default 'stripe',
  add column if not exists manual_channel text,
  add column if not exists manual_reference text,
  add column if not exists manual_payer_name text,
  add column if not exists manual_phone text,
  add column if not exists manual_note text,
  add column if not exists manual_confirmed_by uuid references public.profiles(id),
  add column if not exists manual_confirmed_at timestamptz,
  add column if not exists handover_ready_at timestamptz,
  add column if not exists handover_notes text;

alter table public.transactions
  drop constraint if exists transactions_payment_method_check;
alter table public.transactions
  add constraint transactions_payment_method_check
  check (payment_method in ('stripe','manual'));

alter table public.transactions
  drop constraint if exists transactions_manual_channel_check;
alter table public.transactions
  add constraint transactions_manual_channel_check
  check (manual_channel is null or manual_channel in ('mpesa','bank'));

-- allow the new awaiting_manual_payment status
alter table public.transactions drop constraint if exists transactions_status_check;
alter table public.transactions
  add constraint transactions_status_check
  check (status in (
    'pending', 'awaiting_manual_payment', 'payment_received', 'admin_reviewing',
    'funds_released', 'completed', 'disputed', 'refunded', 'cancelled'
  ));

commit;

