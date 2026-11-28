-- fix: cron de campanhas e allowlist de alertas de segurança
-- Causa raiz (48 erros/dia no postgres em produção):
--  1) close_expired_sales_campaigns() — sobrescrita em 20260723151640 com colunas
--     inexistentes (goal_amount, is_read) → erro 42703 a cada hora no cron.
--  2) security_alerts_alert_type_check — banco vivo sem 'push_queue_degraded' (e sem
--     lucky_wheel_%/prediction_%) → erro 23514 a cada 15min no cron snapshot.
-- Sempre idempotente; reaplica o constraint completo e restaura a função com colunas reais.

CREATE OR REPLACE FUNCTION public.close_expired_sales_campaigns()
RETURNS TABLE(campaign_id uuid, participants_notified integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  v_campaign RECORD;
  v_notified integer;
BEGIN
  FOR v_campaign IN
    SELECT sc.id, sc.name
      FROM public.sales_campaigns sc
     WHERE sc.status = 'active' AND sc.end_date < now()
     FOR UPDATE SKIP LOCKED
  LOOP
    UPDATE public.sales_campaigns
       SET status = 'completed', updated_at = now()
     WHERE id = v_campaign.id;

    WITH inserted AS (
      INSERT INTO public.notifications (user_id, type, title, message, data)
      SELECT
        cp.user_id,
        'campaign_closed',
        CASE WHEN cp.completed_at IS NOT NULL
             THEN '🏆 Campanha encerrada — meta batida!'
             ELSE 'Campanha encerrada' END,
        CASE WHEN cp.completed_at IS NOT NULL
             THEN 'Parabéns! A campanha "' || v_campaign.name || '" foi encerrada e você bateu a meta.'
             ELSE 'A campanha "' || v_campaign.name || '" foi encerrada. Confira sua posição final.' END,
        jsonb_build_object(
          'campaign_id', v_campaign.id,
          'campaign_name', v_campaign.name,
          'progress', cp.progress,
          'target', cp.target_adjusted,
          'rank_position', cp.rank_position,
          'completed', cp.completed_at IS NOT NULL,
          'url', '/campanhas/' || v_campaign.id
        )
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
$$

REVOKE ALL ON FUNCTION public.close_expired_sales_campaigns() FROM PUBLIC, anon, authenticated

GRANT EXECUTE ON FUNCTION public.close_expired_sales_campaigns() TO service_role

-- Reaplica constraint completo (idempotente) aceitando todos os alert_type emitidos
-- pelo código: security core, burn_rate/error_budget/sla/digest, lucky_wheel,
-- prediction e push_queue_degraded (snapshot_push_outbox_health).
ALTER TABLE public.security_alerts DROP CONSTRAINT IF EXISTS security_alerts_alert_type_check

ALTER TABLE public.security_alerts ADD CONSTRAINT security_alerts_alert_type_check CHECK (
  alert_type = ANY (ARRAY['rate_limit_exceeded','brute_force','suspicious_login','ip_blocked','multiple_failed_2fa','unusual_location'])
  OR alert_type LIKE 'burn_rate_%'
  OR alert_type LIKE 'error_budget_%'
  OR alert_type LIKE 'sla_%'
  OR alert_type LIKE 'digest_%'
  OR alert_type LIKE 'lucky_wheel_%'
  OR alert_type LIKE 'prediction_%'
  OR alert_type = 'push_queue_degraded'
)

CREATE UNIQUE INDEX IF NOT EXISTS security_alerts_prediction_dedupe_idx
  ON public.security_alerts (alert_type, (metadata->>'dedupe_key'))
  WHERE alert_type LIKE 'prediction_%'
