CREATE OR REPLACE FUNCTION public.validate_reset_token(p_token uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF current_setting('request.jwt.claim.role', true) IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'insufficient_privilege' USING ERRCODE = '42501';
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.password_reset_requests
    WHERE reset_token = p_token
      AND status = 'pending'
      AND expires_at > now()
  );
END;
$function$
