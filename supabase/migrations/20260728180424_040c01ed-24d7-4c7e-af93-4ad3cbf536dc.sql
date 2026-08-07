-- 1) Corrige close_expired_sales_campaigns: colunas inexistentes (goal_amount / cp.goal_reached / cp.current_amount)
CREATE OR REPLACE FUNCTION public.close_expired_sales_campaigns()
RETURNS TABLE(campaign_id uuid, participants_notified integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_campaign RECORD;
  v_notified integer;
BEGIN
  FOR v_campaign IN
    SELECT id, name, target_global, target_individual_default
    FROM public.sales_campaigns
    WHERE status = 'active' AND end_date < CURRENT_DATE
    FOR UPDATE SKIP LOCKED
  LOOP
    UPDATE public.sales_campaigns
    SET status = 'completed', updated_at = now()
    WHERE id = v_campaign.id;

    WITH inserted AS (
      INSERT INTO public.notifications (user_id, type, title, message, data, is_read)
      SELECT
        cp.user_id,
        'campaign_closed',
        CASE WHEN COALESCE(cp.progress, 0) >= COALESCE(cp.target_adjusted, v_campaign.target_individual_default, 0)
             THEN '🏆 Campanha encerrada — meta batida!'
             ELSE 'Campanha encerrada' END,
        CASE WHEN COALESCE(cp.progress, 0) >= COALESCE(cp.target_adjusted, v_campaign.target_individual_default, 0)
             THEN 'Parabéns! A campanha "' || v_campaign.name || '" foi encerrada e você bateu a meta.'
             ELSE 'A campanha "' || v_campaign.name || '" foi encerrada. Confira sua posição final.' END,
        jsonb_build_object(
          'campaign_id', v_campaign.id,
          'goal_reached', COALESCE(cp.progress, 0) >= COALESCE(cp.target_adjusted, v_campaign.target_individual_default, 0),
          'rank_position', cp.rank_position,
          'progress', cp.progress,
          'target_adjusted', COALESCE(cp.target_adjusted, v_campaign.target_individual_default),
          'target_global', v_campaign.target_global,
          'url', '/campanhas/' || v_campaign.id
        ),
        false
      FROM public.campaign_participants cp
      WHERE cp.campaign_id = v_campaign.id
        AND cp.declined_at IS NULL
        AND public.user_wants_in_app_notification(cp.user_id, 'campaign_closed')
      RETURNING 1
    )
    SELECT COUNT(*) INTO v_notified FROM inserted;

    campaign_id := v_campaign.id;
    participants_notified := COALESCE(v_notified, 0);
    RETURN NEXT;
  END LOOP;
END;
$fn$;

-- 2) Remove a sobrecarga sem argumentos de cleanup_old_security_logs (ambígua e apontando para tabela inexistente)
DROP FUNCTION IF EXISTS public.cleanup_old_security_logs();

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

REVOKE ALL ON FUNCTION public.cleanup_old_security_logs(integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.close_expired_sales_campaigns() FROM PUBLIC, anon, authenticated;