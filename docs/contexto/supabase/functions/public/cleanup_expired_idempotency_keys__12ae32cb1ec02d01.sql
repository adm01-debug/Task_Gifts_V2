CREATE OR REPLACE FUNCTION public.cleanup_expired_idempotency_keys()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    DELETE FROM public.webhook_idempotency WHERE expires_at < now();
END;
$function$
