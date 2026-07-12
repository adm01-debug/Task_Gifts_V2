
CREATE OR REPLACE FUNCTION public.get_reliability_slo(p_hours integer DEFAULT 24)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_since timestamptz := now() - (p_hours || ' hours')::interval;
  v_wh jsonb;
  v_api jsonb;
  v_alerts jsonb;
BEGIN
  IF v_uid IS NULL OR NOT public.has_role(v_uid, 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden: admin_only';
  END IF;

  SELECT jsonb_build_object(
    'total', COUNT(*),
    'success', COUNT(*) FILTER (WHERE success),
    'failed', COUNT(*) FILTER (WHERE NOT success),
    'success_rate', CASE WHEN COUNT(*) = 0 THEN 100
      ELSE ROUND((COUNT(*) FILTER (WHERE success))::numeric * 100 / COUNT(*), 2) END,
    'p95_ms', COALESCE(percentile_cont(0.95) WITHIN GROUP (ORDER BY duration_ms), 0)::integer,
    'avg_ms', COALESCE(ROUND(AVG(duration_ms)), 0)::integer,
    'max_ms', COALESCE(MAX(duration_ms), 0)
  ) INTO v_wh
  FROM public.webhook_delivery_logs
  WHERE created_at >= v_since;

  SELECT jsonb_build_object(
    'total', COUNT(*),
    'success', COUNT(*) FILTER (WHERE response_status < 400),
    'failed', COUNT(*) FILTER (WHERE response_status >= 400),
    'success_rate', CASE WHEN COUNT(*) = 0 THEN 100
      ELSE ROUND((COUNT(*) FILTER (WHERE response_status < 400))::numeric * 100 / COUNT(*), 2) END,
    'p95_ms', COALESCE(percentile_cont(0.95) WITHIN GROUP (ORDER BY duration_ms), 0)::integer,
    'avg_ms', COALESCE(ROUND(AVG(duration_ms)), 0)::integer,
    'server_errors', COUNT(*) FILTER (WHERE response_status >= 500)
  ) INTO v_api
  FROM public.api_request_logs
  WHERE created_at >= v_since;

  SELECT jsonb_build_object(
    'total', COUNT(*),
    'resolved', COUNT(*) FILTER (WHERE resolved),
    'pending', COUNT(*) FILTER (WHERE NOT resolved),
    'critical', COUNT(*) FILTER (WHERE severity = 'critical'),
    'high', COUNT(*) FILTER (WHERE severity = 'high'),
    'mttr_min', COALESCE(ROUND(AVG(
      EXTRACT(EPOCH FROM (resolved_at - created_at)) / 60
    ) FILTER (WHERE resolved AND resolved_at IS NOT NULL))::integer, 0)
  ) INTO v_alerts
  FROM public.security_alerts
  WHERE created_at >= v_since;

  RETURN jsonb_build_object(
    'window_hours', p_hours,
    'generated_at', now(),
    'webhooks', COALESCE(v_wh, '{}'::jsonb),
    'external_api', COALESCE(v_api, '{}'::jsonb),
    'security_alerts', COALESCE(v_alerts, '{}'::jsonb)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_reliability_slo(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_reliability_slo(integer) TO authenticated;

-- Timeline por hora (últimas 24h) para gráficos de tendência
CREATE OR REPLACE FUNCTION public.get_reliability_timeline(p_hours integer DEFAULT 24)
RETURNS TABLE(
  bucket timestamptz,
  webhook_total bigint,
  webhook_success bigint,
  webhook_p95_ms integer,
  api_total bigint,
  api_errors bigint,
  api_p95_ms integer
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  WITH hours AS (
    SELECT generate_series(
      date_trunc('hour', now() - (p_hours || ' hours')::interval),
      date_trunc('hour', now()),
      interval '1 hour'
    ) AS bucket
  ),
  wh AS (
    SELECT date_trunc('hour', created_at) AS bucket,
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE success) AS success,
      COALESCE(percentile_cont(0.95) WITHIN GROUP (ORDER BY duration_ms), 0)::integer AS p95
    FROM public.webhook_delivery_logs
    WHERE created_at >= now() - (p_hours || ' hours')::interval
    GROUP BY 1
  ),
  api AS (
    SELECT date_trunc('hour', created_at) AS bucket,
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE response_status >= 400) AS errors,
      COALESCE(percentile_cont(0.95) WITHIN GROUP (ORDER BY duration_ms), 0)::integer AS p95
    FROM public.api_request_logs
    WHERE created_at >= now() - (p_hours || ' hours')::interval
    GROUP BY 1
  )
  SELECT h.bucket,
    COALESCE(wh.total, 0), COALESCE(wh.success, 0), COALESCE(wh.p95, 0),
    COALESCE(api.total, 0), COALESCE(api.errors, 0), COALESCE(api.p95, 0)
  FROM hours h
  LEFT JOIN wh ON wh.bucket = h.bucket
  LEFT JOIN api ON api.bucket = h.bucket
  ORDER BY h.bucket ASC;
$$;

REVOKE ALL ON FUNCTION public.get_reliability_timeline(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_reliability_timeline(integer) TO authenticated;
