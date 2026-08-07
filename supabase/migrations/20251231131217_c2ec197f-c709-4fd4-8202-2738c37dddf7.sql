-- Drop tables if they partially exist from previous failed migrations
DROP TABLE IF EXISTS public.geo_allowed_countries CASCADE;
DROP TABLE IF EXISTS public.geo_settings CASCADE;

-- Create table for allowed countries (whitelist)
CREATE TABLE public.geo_allowed_countries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  country_code VARCHAR(2) NOT NULL UNIQUE,
  country_name VARCHAR(100) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create geo settings table
CREATE TABLE public.geo_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  block_unknown_countries BOOLEAN NOT NULL DEFAULT true,
  log_all_access BOOLEAN NOT NULL DEFAULT true,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.geo_allowed_countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geo_settings ENABLE ROW LEVEL SECURITY;

-- Policies for geo_allowed_countries
CREATE POLICY "Everyone can view allowed countries"
  ON public.geo_allowed_countries FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage allowed countries"
  ON public.geo_allowed_countries FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
    )
  );

-- Policies for geo_settings
CREATE POLICY "Everyone can view geo settings"
  ON public.geo_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage geo settings"
  ON public.geo_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
    )
  );

-- Insert default settings
INSERT INTO public.geo_settings (is_enabled, block_unknown_countries, log_all_access)
VALUES (false, true, true);

-- Insert common countries as defaults
INSERT INTO public.geo_allowed_countries (country_code, country_name) VALUES
  ('BR', 'Brasil'),
  ('PT', 'Portugal'),
  ('US', 'Estados Unidos'),
  ('AR', 'Argentina'),
  ('CL', 'Chile'),
  ('CO', 'Colômbia'),
  ('MX', 'México'),
  ('UY', 'Uruguai'),
  ('PY', 'Paraguai'),
  ('PE', 'Peru');

-- Create function to check if country is allowed
CREATE OR REPLACE FUNCTION public.is_country_allowed(p_country_code VARCHAR(2))
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_settings geo_settings;
  v_is_allowed BOOLEAN;
BEGIN
  SELECT * INTO v_settings FROM geo_settings LIMIT 1;
  
  IF v_settings IS NULL OR NOT v_settings.is_enabled THEN
    RETURN true;
  END IF;
  
  IF p_country_code IS NULL THEN
    RETURN NOT v_settings.block_unknown_countries;
  END IF;
  
  SELECT EXISTS (
    SELECT 1 FROM geo_allowed_countries
    WHERE country_code = p_country_code AND is_active = true
  ) INTO v_is_allowed;
  
  RETURN v_is_allowed;
END;
$$;

-- Create indexes
CREATE INDEX idx_geo_allowed_countries_code ON public.geo_allowed_countries(country_code);
CREATE INDEX idx_geo_allowed_countries_active ON public.geo_allowed_countries(is_active);