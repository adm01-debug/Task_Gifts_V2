
-- RPC: Detecta violações de SLA na semana corrente e cria security_alerts
CREATE OR REPLACE FUNCTION public.check_sla_breaches_and_alert()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_week_start timestamptz := date_trunc('week', now());
  v_row record;
  v_alert_id uuid;
  v_created int := 0;
  v_results jsonb := '[]'::jsonb;
BEGIN
  IF current_setting('request.jwt.claim.role', true) <> 'service_role'
     AND (auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::app_role)) THEN
    RAISE EXCEPTION 'insufficient_privilege' USING ERRCODE = '42501';
  END IF;

  FOR v_row IN
    WITH agg AS (
      SELECT
        sa.alert_type,
        COUNT(*) FILTER (WHERE sa.acknowledged_at IS NOT NULL) AS ack_count,
        COUNT(*) FILTER (WHERE sa.is_resolved AND sa.resolved_at IS NOT NULL) AS res_count,
        AVG(EXTRACT(EPOCH FROM (sa.acknowledged_at - sa.created_at)))
          FILTER (WHERE sa.acknowledged_at IS NOT NULL) AS mtta_sec,
        AVG(EXTRACT(EPOCH FROM (sa.resolved_at - sa.created_at)))
          FILTER (WHERE sa.is_resolved AND sa.resolved_at IS NOT NULL) AS mttr_sec
      FROM public.security_alerts sa
      WHERE sa.created_at >= v_week_start
        AND sa.alert_type <> 'sla_breach'
      GROUP BY sa.alert_type
    )
    SELECT
      a.alert_type, a.mtta_sec, a.mttr_sec, a.ack_count, a.res_count,
      t.mtta_target_seconds, t.mttr_target_seconds
    FROM agg a
    JOIN public.sla_targets t ON t.alert_type = a.alert_type
    WHERE (a.mtta_sec IS NOT NULL AND a.mtta_sec > t.mtta_target_seconds)
       OR (a.mttr_sec IS NOT NULL AND a.mttr_sec > t.mttr_target_seconds)
  LOOP
    -- Deduplicação: não cria alerta duplicado para o mesmo tipo na mesma semana
    IF EXISTS (
      SELECT 1 FROM public.security_alerts
      WHERE alert_type = 'sla_breach'
        AND created_at >= v_week_start
        AND metadata->>'target_alert_type' = v_row.alert_type
    ) THEN
      CONTINUE;
    END IF;

    INSERT INTO public.security_alerts (alert_type, severity, title, description, metadata)
    VALUES (
      'sla_breach',
      CASE
        WHEN (v_row.mttr_sec IS NOT NULL AND v_row.mttr_sec > v_row.mttr_target_seconds * 2)
          OR (v_row.mtta_sec IS NOT NULL AND v_row.mtta_sec > v_row.mtta_target_seconds * 2)
        THEN 'high' ELSE 'medium'
      END,
      format('SLA violado: %s (semana atual)', v_row.alert_type),
      format(
        'Semana %s — MTTA %ss (meta %ss) · MTTR %ss (meta %ss).',
        to_char(v_week_start, 'DD/MM/YYYY'),
        COALESCE(round(v_row.mtta_sec)::text, '—'),
        v_row.mtta_target_seconds::text,
        COALESCE(round(v_row.mttr_sec)::text, '—'),
        v_row.mttr_target_seconds::text
      ),
      jsonb_build_object(
        'target_alert_type', v_row.alert_type,
        'week_start', v_week_start,
        'mtta_seconds', v_row.mtta_sec,
        'mttr_seconds', v_row.mttr_sec,
        'mtta_target_seconds', v_row.mtta_target_seconds,
        'mttr_target_seconds', v_row.mttr_target_seconds,
        'mtta_breached', v_row.mtta_sec IS NOT NULL AND v_row.mtta_sec > v_row.mtta_target_seconds,
        'mttr_breached', v_row.mttr_sec IS NOT NULL AND v_row.mttr_sec > v_row.mttr_target_seconds,
        'deep_link', '/admin/incident-metrics?type=' || v_row.alert_type
      )
    )
    RETURNING id INTO v_alert_id;

    v_created := v_created + 1;
    v_results := v_results || jsonb_build_object(
      'alert_id', v_alert_id,
      'target_alert_type', v_row.alert_type,
      'mtta_sec', v_row.mtta_sec,
      'mttr_sec', v_row.mttr_sec
    );
  END LOOP;

  RETURN jsonb_build_object(
    'week_start', v_week_start,
    'created_count', v_created,
    'results', v_results,
    'executed_at', now()
  );
END;
$$;

REVOKE ALL ON FUNCTION public.check_sla_breaches_and_alert() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_sla_breaches_and_alert() TO service_role;

-- Cron semanal: segunda-feira 08:00 UTC
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('sla_breach_weekly_check')
      WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'sla_breach_weekly_check');
    PERFORM cron.schedule(
      'sla_breach_weekly_check',
      '0 8 * * 1',
      $cron$ SELECT public.check_sla_breaches_and_alert(); $cron$
    );
  END IF;
END
$$;
