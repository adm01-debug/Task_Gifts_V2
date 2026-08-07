-- Fix: reset_token is UUID type, cast parameter
CREATE OR REPLACE FUNCTION public.validate_reset_token(p_token uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.password_reset_requests
    WHERE reset_token = p_token
      AND status = 'pending'
      AND expires_at > now()
  );
$$;

-- 2FA secure status function
CREATE OR REPLACE FUNCTION public.get_2fa_status(p_user_id uuid)
RETURNS TABLE(is_enabled boolean, verified_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT is_enabled, verified_at
  FROM public.user_two_factor
  WHERE user_id = p_user_id;
$$;