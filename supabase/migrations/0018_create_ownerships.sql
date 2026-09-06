CREATE TABLE public.ownerships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id UUID NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'current',
  start_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Ensure a car can only have one 'current' owner at a time
CREATE UNIQUE INDEX idx_ownerships_current_car ON public.ownerships (car_id) WHERE status = 'current';

ALTER TABLE public.ownerships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own ownerships" 
ON public.ownerships 
FOR SELECT 
USING (auth.uid() = user_id);
