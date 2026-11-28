CREATE OR REPLACE FUNCTION public.auto_block_ip(p_ip_address inet, p_reason text, p_block_type text DEFAULT 'rate_limit'::text, p_duration_minutes integer DEFAULT 15)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_blocked_id UUID;
    v_existing RECORD;
BEGIN
    -- Verificar se já existe
    SELECT * INTO v_existing FROM public.blocked_ips WHERE ip_address = p_ip_address;
    
    IF v_existing IS NOT NULL THEN
        -- Atualizar violação existente
        UPDATE public.blocked_ips
        SET 
            violation_count = violation_count + 1,
            expires_at = CASE 
                WHEN is_permanent THEN NULL
                ELSE now() + (p_duration_minutes * (violation_count + 1) * INTERVAL '1 minute')
            END,
            is_permanent = CASE WHEN violation_count >= 5 THEN true ELSE false END,
            reason = p_reason,
            updated_at = now()
        WHERE ip_address = p_ip_address
        RETURNING id INTO v_blocked_id;
    ELSE
        -- Criar novo bloqueio
        INSERT INTO public.blocked_ips (ip_address, reason, block_type, expires_at)
        VALUES (p_ip_address, p_reason, p_block_type, now() + (p_duration_minutes * INTERVAL '1 minute'))
        RETURNING id INTO v_blocked_id;
    END IF;
    
    -- Criar alerta de segurança
    INSERT INTO public.security_alerts (alert_type, severity, title, description, ip_address, metadata)
    VALUES (
        'ip_blocked',
        CASE WHEN v_existing IS NOT NULL AND v_existing.violation_count >= 3 THEN 'high' ELSE 'medium' END,
        'IP Bloqueado: ' || p_ip_address::TEXT,
        p_reason,
        p_ip_address,
        jsonb_build_object('block_type', p_block_type, 'duration_minutes', p_duration_minutes)
    );
    
    RETURN v_blocked_id;
END;
$function$
