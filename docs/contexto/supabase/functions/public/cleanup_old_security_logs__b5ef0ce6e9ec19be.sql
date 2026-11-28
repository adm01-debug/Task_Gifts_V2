CREATE OR REPLACE FUNCTION public.cleanup_old_security_logs(p_days_to_keep integer DEFAULT 90)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_rate_limit_deleted INTEGER;
    v_login_attempts_deleted INTEGER;
    v_session_logs_deleted INTEGER;
    v_expired_blocks_deleted INTEGER;
    v_webhook_logs_deleted INTEGER;
BEGIN
    -- auth.uid() é NULL quando executada pelo cron/service_role: nesse caso não exige papel.
    IF auth.uid() IS NOT NULL THEN
      PERFORM public._require_admin();
    END IF;

    IF p_days_to_keep IS NULL OR p_days_to_keep < 1 THEN
      RAISE EXCEPTION 'p_days_to_keep deve ser >= 1';
    END IF;

    DELETE FROM public.rate_limit_logs
    WHERE created_at < now() - (p_days_to_keep * INTERVAL '1 day');
    GET DIAGNOSTICS v_rate_limit_deleted = ROW_COUNT;

    DELETE FROM public.login_attempts
    WHERE created_at < now() - (p_days_to_keep * INTERVAL '1 day');
    GET DIAGNOSTICS v_login_attempts_deleted = ROW_COUNT;

    DELETE FROM public.session_logs
    WHERE is_active = false
      AND logout_at < now() - (p_days_to_keep * INTERVAL '1 day');
    GET DIAGNOSTICS v_session_logs_deleted = ROW_COUNT;

    DELETE FROM public.blocked_ips
    WHERE is_permanent = false
      AND expires_at < now() - INTERVAL '7 days';
    GET DIAGNOSTICS v_expired_blocks_deleted = ROW_COUNT;

    DELETE FROM public.bitrix24_webhook_logs
    WHERE processed = true
      AND created_at < now() - INTERVAL '30 days';
    GET DIAGNOSTICS v_webhook_logs_deleted = ROW_COUNT;

    RETURN jsonb_build_object(
        'days_kept', p_days_to_keep,
        'rate_limit_logs_deleted', v_rate_limit_deleted,
        'login_attempts_deleted', v_login_attempts_deleted,
        'session_logs_deleted', v_session_logs_deleted,
        'expired_blocks_deleted', v_expired_blocks_deleted,
        'bitrix24_webhook_logs_deleted', v_webhook_logs_deleted,
        'cleaned_at', now()
    );
END;
$function$
