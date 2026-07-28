-- Correção: a limpeza é disparada pelos painéis admin no cliente; devolve o acesso
-- a authenticated, mas exigindo administrador dentro da própria função.
CREATE OR REPLACE FUNCTION public.cleanup_old_security_logs(p_days_to_keep integer DEFAULT 90)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
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
$fn$;

GRANT EXECUTE ON FUNCTION public.cleanup_old_security_logs(integer) TO authenticated;

-- Endurecimento em massa das funções SECURITY DEFINER expostas ao papel anon.
DO $do$
DECLARE
  r RECORD;
  -- Propositalmente públicas (fluxos pré-login / página pública):
  v_keep_anon text[] := ARRAY['verify_certificate', 'get_passkeys_by_email'];
  -- Puramente internas (cron, dispatcher service_role, triggers, guards):
  v_system_only text[] := ARRAY[
    '_require_admin', '_require_manager_or_admin',
    'auto_promote_expired_webhook_secrets', 'check_webhook_sla_and_alert',
    'claim_push_outbox', 'enqueue_push',
    'user_wants_push_notification', 'user_wants_email_notification',
    'boss_hook_attendance_streaks', 'boss_hook_task_scores', 'boss_hook_trail_enrollments',
    'boss_phase_alert_hook', 'card_pack_hook_attendance_streaks', 'card_pack_hook_task_scores',
    'card_pack_hook_trail_enrollments', 'card_pack_notify',
    'enforce_campaign_team_consistency', 'log_purchase_requested',
    'log_wager_integrity_review_event', 'trigger_dispatch_critical_alert'
  ];
  v_anon integer := 0;
  v_auth integer := 0;
BEGIN
  FOR r IN
    SELECT p.oid, p.proname
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef
      AND NOT (p.proname = ANY (v_keep_anon))
  LOOP
    IF has_function_privilege('anon', r.oid, 'EXECUTE') THEN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon', r.oid::regprocedure);
      v_anon := v_anon + 1;
    END IF;

    IF r.proname = ANY (v_system_only)
       AND has_function_privilege('authenticated', r.oid, 'EXECUTE') THEN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM authenticated', r.oid::regprocedure);
      v_auth := v_auth + 1;
    END IF;
  END LOOP;

  RAISE NOTICE 'Revogado EXECUTE de anon em % funções e de authenticated em % funções internas', v_anon, v_auth;
END;
$do$;