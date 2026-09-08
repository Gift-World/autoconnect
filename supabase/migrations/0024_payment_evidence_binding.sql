-- Bind a provider checkout request to the transaction that created it. This
-- prevents a caller from presenting an unrelated M-Pesa status as evidence.
begin;
alter table public.transactions add column if not exists mpesa_checkout_request_id text unique;
alter table public.transactions add column if not exists payment_evidence_received_at timestamptz;
create index if not exists transactions_mpesa_checkout_request_idx on public.transactions(mpesa_checkout_request_id) where mpesa_checkout_request_id is not null;
commit;
