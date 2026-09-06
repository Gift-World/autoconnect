CREATE TABLE public.vehicle_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id UUID NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_vehicle_events_car_id ON public.vehicle_events (car_id);

ALTER TABLE public.vehicle_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view vehicle events" 
ON public.vehicle_events 
FOR SELECT 
USING (true);
