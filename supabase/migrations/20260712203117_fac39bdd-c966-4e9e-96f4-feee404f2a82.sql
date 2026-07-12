
CREATE OR REPLACE FUNCTION public.check_webhook_sla_and_alert(
  p_threshold_pct numeric DEFAULT 95,
  p_window_hours integer DEFAULT 24
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hours integer := GREATEST(1, LEAST(168, COALESCE(p_window_hours, 24)));
  v_threshold numeric := GREATEST(0, LEAST(100, COALESCE(p_threshold_pct, 95)));
  v_total bigint;
  v_ok bigint;
  v_fail bigint;
  v_sla numeric;
  v_alert_id uuid;
  v_worst jsonb;
BEGIN
  IF current_setting('request.jwt.claim.role', true) <> 'service_role'
     AND (auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::app_role)) THEN
    RAISE EXCEPTION 'insufficient_privilege' USING ERRCODE = '42501';
  END IF;

  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE success),
    COUNT(*) FILTER (WHERE NOT success)
  INTO v_total, v_ok, v_fail
  FROM public.webhook_delivery_logs
  WHERE created_at >= now() - (v_hours * interval '1 hour');

  IF v_total = 0 THEN
    RETURN jsonb_build_object(
      'sla_pct', NULL, 'total', 0, 'threshold_pct', v_threshold,
      'window_hours', v_hours, 'alert_created', false, 'reason', 'no_deliveries'
    );
  END IF;

  v_sla := ROUND((v_ok::numeric / v_total) * 100, 3);

  IF v_sla >= v_threshold THEN
    RETURN jsonb_build_object(
      'sla_pct', v_sla, 'total', v_total, 'threshold_pct', v_threshold,
      'window_hours', v_hours, 'alert_created', false
    );
  END IF;

  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
    INTO v_worst
  FROM (
    SELECT
      s.id AS subscription_id, s.name, s.url,
      COUNT(l.id) AS total,
      COUNT(l.id) FILTER (WHERE NOT l.success) AS failed
    FROM public.webhook_subscriptions s
    JOIN public.webhook_delivery_logs l ON l.subscription_id = s.id
    WHERE l.created_at >= now() - (v_hours * interval '1 hour')
    GROUP BY s.id, s.name, s.url
    HAVING COUNT(l.id) FILTER (WHERE NOT l.success) > 0
    ORDER BY COUNT(l.id) FILTER (WHERE NOT l.success) DESC
    LIMIT 5
  ) t;

  INSERT INTO public.security_alerts (alert_type, severity, title, description, metadata)
  VALUES (
    'webhook_sla_below_threshold',
    CASE WHEN v_sla < 80 THEN 'high'
         WHEN v_sla < 90 THEN 'medium'
         ELSE 'low' END,
    format('SLA de webhooks em %s%% (limite %s%%)', v_sla, v_threshold),
    format('Nas últimas %sh: %s entregas, %s falhas (%s%% de sucesso). Limite mínimo: %s%%.',
           v_hours, v_total, v_fail, v_sla, v_threshold),
    jsonb_build_object(
      'sla_pct', v_sla,
      'threshold_pct', v_threshold,
      'window_hours', v_hours,
      'total', v_total,
      'successful', v_ok,
      'failed', v_fail,
      'worst_offenders', v_worst,
      'checked_at', now()
    )
  )
  RETURNING id INTO v_alert_id;

  RETURN jsonb_build_object(
    'sla_pct', v_sla,
    'total', v_total,
    'threshold_pct', v_threshold,
    'window_hours', v_hours,
    'alert_created', true,
    'alert_id', v_alert_id,
    'worst_offenders', v_worst
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.check_webhook_sla_and_alert(numeric, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_webhook_sla_and_alert(numeric, integer) TO authenticated, service_role;

-- Agenda cron diário às 04:00 UTC (após auto-promoção de rotações às 03:00)
SELECT cron.unschedule('webhook-sla-daily-check') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'webhook-sla-daily-check'
);

SELECT cron.schedule(
  'webhook-sla-daily-check',
  '0 4 * * *',
  $$ SELECT public.check_webhook_sla_and_alert(95, 24); $$
);
