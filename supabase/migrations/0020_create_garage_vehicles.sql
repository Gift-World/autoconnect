-- Create garage_vehicles table for manually added vehicles
CREATE TABLE IF NOT EXISTS public.garage_vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nickname TEXT,
    make_name TEXT NOT NULL,
    model_name TEXT NOT NULL,
    year INTEGER NOT NULL,
    vin TEXT,
    mileage INTEGER,
    mileage_unit TEXT DEFAULT 'km',
    next_service_at DATE,
    next_service_mileage INTEGER,
    insurance_renews_at DATE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.garage_vehicles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own garage vehicles"
    ON public.garage_vehicles
    FOR SELECT
    USING (auth.uid() = owner_id OR owner_id = '00000000-0000-0000-0000-000000000001');

CREATE POLICY "Users can insert their own garage vehicles"
    ON public.garage_vehicles
    FOR INSERT
    WITH CHECK (auth.uid() = owner_id OR owner_id = '00000000-0000-0000-0000-000000000001');

CREATE POLICY "Users can update their own garage vehicles"
    ON public.garage_vehicles
    FOR UPDATE
    USING (auth.uid() = owner_id OR owner_id = '00000000-0000-0000-0000-000000000001')
    WITH CHECK (auth.uid() = owner_id OR owner_id = '00000000-0000-0000-0000-000000000001');

CREATE POLICY "Users can delete their own garage vehicles"
    ON public.garage_vehicles
    FOR DELETE
    USING (auth.uid() = owner_id OR owner_id = '00000000-0000-0000-0000-000000000001');

-- Optional: For demo mode, we might want to allow anon to read/insert for testing if needed.
-- But standard practice is to let them sign in, or temporarily disable RLS for local dev.
