-- Create service_providers table for Phase 3
CREATE TABLE IF NOT EXISTS public.service_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    provider_type TEXT NOT NULL, -- mechanic, garage, inspection, logistics, insurance, roadside
    country TEXT NOT NULL,
    city TEXT,
    description TEXT,
    phone TEXT,
    email TEXT,
    is_verified BOOLEAN DEFAULT false,
    is_approved BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public can view approved service providers"
    ON public.service_providers
    FOR SELECT
    USING (is_approved = true);

-- Admins can manage service providers
CREATE POLICY "Admins can manage service providers"
    ON public.service_providers
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Seed some mock data for development
INSERT INTO public.service_providers (name, provider_type, country, city, description, is_verified, is_approved)
VALUES 
    ('AutoConnect Certified Inspection', 'inspection', 'Kenya', 'Nairobi', 'Independent official 42-point vehicle inspection.', true, true),
    ('Global Transport & Logistics', 'logistics', 'Japan', 'Yokohama', 'Door-to-door vehicle shipping and clearing.', true, true),
    ('Premium Auto Cover', 'insurance', 'Kenya', 'Nairobi', 'Comprehensive vehicle insurance partner.', true, true),
    ('Elite Auto Garage', 'garage', 'Kenya', 'Mombasa', 'Specialist in German and Japanese vehicles.', false, true)
ON CONFLICT DO NOTHING;
