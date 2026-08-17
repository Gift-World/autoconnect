-- =========================================================
-- 0004_payments.sql — Stripe Connect escrow & transactions
-- =========================================================

-- Sellers: Stripe Connect Express account
ALTER TABLE public.sellers
  ADD COLUMN IF NOT EXISTS stripe_account_id text,
  ADD COLUMN IF NOT EXISTS stripe_onboarded boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_charges_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_payouts_enabled boolean NOT NULL DEFAULT false;

-- Allow a new "under_transaction" status on cars
-- (status is plain text, no enum constraint to alter)

-- Transactions (escrow records)
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id uuid NOT NULL REFERENCES public.cars(id) ON DELETE RESTRICT,
  buyer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  seller_id uuid NOT NULL REFERENCES public.sellers(id) ON DELETE RESTRICT,

  -- Display amounts (in listing currency)
  display_currency text NOT NULL,
  display_car_price numeric(14,2) NOT NULL,
  display_service_fee numeric(14,2) NOT NULL,
  display_total numeric(14,2) NOT NULL,

  -- Stripe charge amounts (always USD cents)
  fx_rate numeric(14,6) NOT NULL DEFAULT 1,
  car_price_usd_cents bigint NOT NULL,
  service_fee_usd_cents bigint NOT NULL,
  total_usd_cents bigint NOT NULL,
  service_fee_percent numeric(5,2) NOT NULL DEFAULT 5,

  -- Stripe
  stripe_payment_intent_id text UNIQUE,
  stripe_charge_id text,
  stripe_seller_account_id text,
  stripe_transfer_id text,
  stripe_refund_id text,

  status text NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'payment_received', 'admin_reviewing',
    'funds_released', 'completed', 'disputed', 'refunded', 'cancelled'
  )),

  initiated_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz,
  released_at timestamptz,
  completed_at timestamptz,
  disputed_at timestamptz,

  admin_notes text,
  dispute_reason text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS transactions_buyer_idx ON public.transactions(buyer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS transactions_seller_idx ON public.transactions(seller_id, created_at DESC);
CREATE INDEX IF NOT EXISTS transactions_car_idx ON public.transactions(car_id);
CREATE INDEX IF NOT EXISTS transactions_status_idx ON public.transactions(status);

-- Grants
GRANT SELECT, INSERT, UPDATE ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;

-- RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS transactions_admin_all ON public.transactions;
CREATE POLICY transactions_admin_all ON public.transactions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS transactions_buyer_select ON public.transactions;
CREATE POLICY transactions_buyer_select ON public.transactions
  FOR SELECT TO authenticated
  USING (buyer_id = auth.uid());

DROP POLICY IF EXISTS transactions_seller_select ON public.transactions;
CREATE POLICY transactions_seller_select ON public.transactions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sellers s
      WHERE s.id = transactions.seller_id AND s.profile_id = auth.uid()
    )
  );

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.transactions_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS trg_transactions_updated_at ON public.transactions;
CREATE TRIGGER trg_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.transactions_set_updated_at();
