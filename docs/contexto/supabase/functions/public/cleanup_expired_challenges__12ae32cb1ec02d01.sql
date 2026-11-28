CREATE OR REPLACE FUNCTION public.cleanup_expired_challenges()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM public.webauthn_challenges WHERE expires_at < now();
END;
$function$
