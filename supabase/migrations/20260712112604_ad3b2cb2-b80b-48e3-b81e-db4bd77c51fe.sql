
-- get_2fa_status: usuário só pode consultar o próprio status
CREATE OR REPLACE FUNCTION public.get_2fa_status(p_user_id uuid)
 RETURNS TABLE(is_enabled boolean, verified_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF current_setting('request.jwt.claim.role', true) <> 'service_role'
     AND (auth.uid() IS NULL OR auth.uid() <> p_user_id) THEN
    RAISE EXCEPTION 'insufficient_privilege' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
    SELECT u.is_enabled, u.verified_at
    FROM public.user_two_factor u
    WHERE u.user_id = p_user_id;
END;
$function$;

-- user_has_passkeys: usuário só pode consultar o próprio status
CREATE OR REPLACE FUNCTION public.user_has_passkeys(p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF current_setting('request.jwt.claim.role', true) <> 'service_role'
     AND (auth.uid() IS NULL OR auth.uid() <> p_user_id) THEN
    RAISE EXCEPTION 'insufficient_privilege' USING ERRCODE = '42501';
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.webauthn_credentials
    WHERE user_id = p_user_id AND is_active = true
  );
END;
$function$;

-- validate_reset_token: só via service_role (Edge Function)
CREATE OR REPLACE FUNCTION public.validate_reset_token(p_token uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF current_setting('request.jwt.claim.role', true) <> 'service_role' THEN
    RAISE EXCEPTION 'insufficient_privilege' USING ERRCODE = '42501';
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.password_reset_requests
    WHERE reset_token = p_token
      AND status = 'pending'
      AND expires_at > now()
  );
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.validate_reset_token(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_reset_token(uuid) TO service_role;
