CREATE OR REPLACE FUNCTION public.is_ip_blocked(p_ip_address inet)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.blocked_ips
        WHERE ip_address = p_ip_address
        AND (is_permanent = true OR expires_at > now())
    );
END;
$function$
