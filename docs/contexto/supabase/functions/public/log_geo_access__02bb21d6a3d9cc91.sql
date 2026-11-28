CREATE OR REPLACE FUNCTION public.log_geo_access(p_ip_address inet, p_country_code character varying, p_country_name character varying, p_user_id uuid, p_was_allowed boolean, p_reason text, p_user_agent text, p_endpoint text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO public.geo_access_logs (
        ip_address, country_code, country_name, user_id, 
        was_allowed, reason, user_agent, endpoint
    )
    VALUES (
        p_ip_address, p_country_code, p_country_name, p_user_id,
        p_was_allowed, p_reason, p_user_agent, p_endpoint
    )
    RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$function$
