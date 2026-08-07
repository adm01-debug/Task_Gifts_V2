-- Create IP whitelist table
CREATE TABLE public.ip_whitelist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address INET NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ,
    UNIQUE(ip_address)
);

-- Enable RLS
ALTER TABLE public.ip_whitelist ENABLE ROW LEVEL SECURITY;

-- Only admins can manage IP whitelist
CREATE POLICY "Admins can view IP whitelist"
ON public.ip_whitelist FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert IP whitelist"
ON public.ip_whitelist FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update IP whitelist"
ON public.ip_whitelist FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete IP whitelist"
ON public.ip_whitelist FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create IP access logs table
CREATE TABLE public.ip_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address INET NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    endpoint TEXT,
    was_allowed BOOLEAN NOT NULL,
    reason TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ip_access_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view logs
CREATE POLICY "Admins can view IP access logs"
ON public.ip_access_logs FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Function to check if IP is whitelisted
CREATE OR REPLACE FUNCTION public.is_ip_whitelisted(p_ip_address INET)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.ip_whitelist
        WHERE ip_address = p_ip_address
        AND is_active = true
        AND (expires_at IS NULL OR expires_at > now())
    );
END;
$$;

-- Function to log IP access
CREATE OR REPLACE FUNCTION public.log_ip_access(
    p_ip_address INET,
    p_user_id UUID,
    p_endpoint TEXT,
    p_was_allowed BOOLEAN,
    p_reason TEXT,
    p_user_agent TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO public.ip_access_logs (ip_address, user_id, endpoint, was_allowed, reason, user_agent)
    VALUES (p_ip_address, p_user_id, p_endpoint, p_was_allowed, p_reason, p_user_agent)
    RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$;

-- Trigger for updated_at
CREATE TRIGGER update_ip_whitelist_updated_at
    BEFORE UPDATE ON public.ip_whitelist
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();