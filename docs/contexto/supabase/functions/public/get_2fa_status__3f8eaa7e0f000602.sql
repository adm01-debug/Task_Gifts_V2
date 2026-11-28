CREATE OR REPLACE FUNCTION public.get_2fa_status(p_user_id uuid)
 RETURNS TABLE(is_enabled boolean, verified_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF current_setting('request.jwt.claim.role', true) IS DISTINCT FROM 'service_role'
     AND (auth.uid() IS NULL OR auth.uid() <> p_user_id) THEN
    RAISE EXCEPTION 'insufficient_privilege' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
    SELECT u.is_enabled, u.verified_at
    FROM public.user_two_factor u
    WHERE u.user_id = p_user_id;
END;
$function$
