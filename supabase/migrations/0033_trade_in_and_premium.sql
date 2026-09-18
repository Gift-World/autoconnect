-- Migration 0033: Trade-ins and Premium Listings

-- 1. Add premium listing columns to cars
ALTER TABLE public.cars
ADD COLUMN is_premium boolean NOT NULL DEFAULT false,
ADD COLUMN premium_until timestamp with time zone;

CREATE INDEX idx_cars_is_premium ON public.cars(is_premium);

-- 2. Create trade_in_requests table
CREATE TABLE public.trade_in_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  seller_id uuid NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  target_car_id uuid NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE,
  make text NOT NULL,
  model text NOT NULL,
  year integer NOT NULL,
  mileage integer NOT NULL,
  condition text NOT NULL,
  location text NOT NULL,
  est_min integer NOT NULL,
  est_max integer NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending, accepted, rejected
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  
  CONSTRAINT pk_trade_in_requests PRIMARY KEY (id)
);

-- RLS policies for trade_in_requests
ALTER TABLE public.trade_in_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
CREATE POLICY "Users can view their own trade-in requests" ON public.trade_in_requests
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own requests
CREATE POLICY "Users can insert their own trade-in requests" ON public.trade_in_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Sellers can view requests sent to them
CREATE POLICY "Sellers can view trade-in requests sent to them" ON public.trade_in_requests
  FOR SELECT USING (
    seller_id IN (
      SELECT id FROM public.sellers WHERE user_id = auth.uid()
    )
  );

-- Sellers can update status of requests sent to them
CREATE POLICY "Sellers can update trade-in requests sent to them" ON public.trade_in_requests
  FOR UPDATE USING (
    seller_id IN (
      SELECT id FROM public.sellers WHERE user_id = auth.uid()
    )
  );
