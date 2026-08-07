-- Dropar função antiga que retornava UUID
DROP FUNCTION IF EXISTS public.log_login_attempt(text, inet, text, text, text);

-- Função para registrar tentativa de login (atualizada para retornar status de bloqueio)
CREATE OR REPLACE FUNCTION public.log_login_attempt(
  p_email text, 
  p_ip_address inet, 
  p_user_agent text, 
  p_attempt_type text DEFAULT 'password', 
  p_error_message text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_log_id UUID;
    v_recent_failures INTEGER;
    v_lockout_status JSONB;
BEGIN
    -- Registrar tentativa
    INSERT INTO public.login_attempts (email, ip_address, user_agent, attempt_type, error_message)
    VALUES (p_email, p_ip_address, p_user_agent, p_attempt_type, p_error_message)
    RETURNING id INTO v_log_id;
    
    -- Verificar tentativas recentes do mesmo IP
    SELECT COUNT(*) INTO v_recent_failures
    FROM public.login_attempts
    WHERE ip_address = p_ip_address
    AND created_at > now() - INTERVAL '15 minutes'
    AND error_message IS NOT NULL;
    
    -- Bloquear automaticamente se muitas falhas do mesmo IP
    IF v_recent_failures >= 10 THEN
        PERFORM public.auto_block_ip(
            p_ip_address,
            'Múltiplas tentativas de login falhadas (' || v_recent_failures || ' em 15 min)',
            'brute_force',
            30
        );
    END IF;
    
    -- Obter status de bloqueio atualizado
    v_lockout_status := public.check_login_lockout(p_email);
    
    RETURN jsonb_build_object(
      'log_id', v_log_id,
      'lockout_status', v_lockout_status
    );
END;
$function$;

-- Função para resetar contagem de tentativas após login bem-sucedido
CREATE OR REPLACE FUNCTION public.reset_login_attempts(p_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Marcar tentativas anteriores como resolvidas
  UPDATE login_attempts
  SET error_message = NULL
  WHERE email = p_email
  AND error_message IS NOT NULL
  AND created_at > now() - INTERVAL '30 minutes';
END;
$function$;