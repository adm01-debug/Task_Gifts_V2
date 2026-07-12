
CREATE OR REPLACE FUNCTION public.get_webhook_executive_metrics_7d()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total bigint;
  v_ok bigint;
  v_fail bigint;
  v_sla numeric;
  v_mttr numeric;
  v_unstable jsonb;
  v_daily jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role)
     AND current_setting('request.jwt.claim.role', true) <> 'service_role' THEN
    RAISE EXCEPTION 'access_denied: admin role required';
  END IF;

  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE success),
    COUNT(*) FILTER (WHERE NOT success)
  INTO v_total, v_ok, v_fail
  FROM public.webhook_delivery_logs
  WHERE created_at >= now() - interval '7 days';

  v_sla := CASE WHEN v_total > 0 THEN ROUND((v_ok::numeric / v_total) * 100, 3) ELSE NULL END;

  -- MTTR: para cada falha, tempo até a próxima entrega bem-sucedida (mesma subscription)
  WITH failures AS (
    SELECT id, subscription_id, created_at
    FROM public.webhook_delivery_logs
    WHERE created_at >= now() - interval '7 days' AND NOT success
  ),
  recovery AS (
    SELECT f.id,
      (SELECT MIN(l.created_at) FROM public.webhook_delivery_logs l
        WHERE l.subscription_id = f.subscription_id
          AND l.success = true
          AND l.created_at > f.created_at
          AND l.created_at <= f.created_at + interval '6 hours') AS recovered_at,
      f.created_at
    FROM failures f
  )
  SELECT ROUND(AVG(EXTRACT(EPOCH FROM (recovered_at - created_at)))::numeric, 1)
    INTO v_mttr
  FROM recovery
  WHERE recovered_at IS NOT NULL;

  SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY t.failed_deliveries DESC), '[]'::jsonb)
    INTO v_unstable
  FROM (
    SELECT
      s.id AS subscription_id,
      s.name AS subscription_name,
      s.url AS subscription_url,
      COUNT(l.id) AS total,
      COUNT(l.id) FILTER (WHERE l.success) AS successful,
      COUNT(l.id) FILTER (WHERE NOT l.success) AS failed_deliveries,
      CASE WHEN COUNT(l.id) > 0
        THEN ROUND((COUNT(l.id) FILTER (WHERE l.success)::numeric / COUNT(l.id)) * 100, 2)
        ELSE NULL END AS success_rate_pct
    FROM public.webhook_subscriptions s
    JOIN public.webhook_delivery_logs l ON l.subscription_id = s.id
    WHERE l.created_at >= now() - interval '7 days'
    GROUP BY s.id, s.name, s.url
    HAVING COUNT(l.id) FILTER (WHERE NOT l.success) > 0
    ORDER BY COUNT(l.id) FILTER (WHERE NOT l.success) DESC
    LIMIT 10
  ) t;

  WITH days AS (
    SELECT generate_series(
      date_trunc('day', now() - interval '6 days'),
      date_trunc('day', now()),
      interval '1 day'
    ) AS day
  )
  SELECT COALESCE(jsonb_agg(row_to_json(d) ORDER BY d.day), '[]'::jsonb)
    INTO v_daily
  FROM (
    SELECT
      to_char(d.day, 'DD/MM') AS day,
      COALESCE(COUNT(l.id), 0) AS total,
      COALESCE(COUNT(l.id) FILTER (WHERE l.success), 0) AS successful,
      COALESCE(COUNT(l.id) FILTER (WHERE NOT l.success), 0) AS failed,
      CASE WHEN COUNT(l.id) > 0
        THEN ROUND((COUNT(l.id) FILTER (WHERE l.success)::numeric / COUNT(l.id)) * 100, 2)
        ELSE NULL END AS sla_pct
    FROM days d
    LEFT JOIN public.webhook_delivery_logs l
      ON date_trunc('day', l.created_at) = d.day
     AND l.created_at >= now() - interval '7 days'
    GROUP BY d.day
  ) d;

  RETURN jsonb_build_object(
    'sla_pct', v_sla,
    'mttr_seconds', v_mttr,
    'total_deliveries', v_total,
    'successful_deliveries', v_ok,
    'failed_deliveries', v_fail,
    'unstable_endpoints', v_unstable,
    'daily', v_daily,
    'generated_at', now()
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_webhook_executive_metrics_7d() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_webhook_executive_metrics_7d() TO authenticated, service_role;
