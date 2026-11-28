CREATE OR REPLACE FUNCTION public.is_ip_whitelisted(p_ip_address inet)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.ip_whitelist
        WHERE ip_address = p_ip_address
        AND is_active = true
        AND (expires_at IS NULL OR expires_at > now())
    );
END;
$function$
