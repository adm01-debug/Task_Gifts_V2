CREATE OR REPLACE FUNCTION public.log_ip_access(p_ip_address inet, p_user_id uuid, p_endpoint text, p_was_allowed boolean, p_reason text, p_user_agent text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO public.ip_access_logs (ip_address, user_id, endpoint, was_allowed, reason, user_agent)
    VALUES (p_ip_address, p_user_id, p_endpoint, p_was_allowed, p_reason, p_user_agent)
    RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$function$
