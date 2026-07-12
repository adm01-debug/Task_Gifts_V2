
CREATE OR REPLACE FUNCTION public.get_error_budget_30d(
  p_webhook_slo NUMERIC DEFAULT 99.0,
  p_api_slo NUMERIC DEFAULT 99.0
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_result JSONB;
  v_wh_total BIGINT;
  v_wh_success BIGINT;
  v_wh_fail BIGINT;
  v_wh_rate NUMERIC;
  v_wh_budget_total NUMERIC;
  v_wh_budget_consumed NUMERIC;
  v_wh_burn_pct NUMERIC;
  v_api_total BIGINT;
  v_api_success BIGINT;
  v_api_fail BIGINT;
  v_api_rate NUMERIC;
  v_api_budget_total NUMERIC;
  v_api_budget_consumed NUMERIC;
  v_api_burn_pct NUMERIC;
  v_timeline JSONB;
BEGIN
  SELECT public.has_role(auth.uid(), 'admin'::app_role) INTO v_is_admin;
  IF NOT COALESCE(v_is_admin, false) THEN
    RAISE EXCEPTION 'access_denied: admin only';
  END IF;

  -- Webhooks aggregate
  SELECT
    COUNT(*)::BIGINT,
    COUNT(*) FILTER (WHERE success = true)::BIGINT,
    COUNT(*) FILTER (WHERE success = false)::BIGINT
  INTO v_wh_total, v_wh_success, v_wh_fail
  FROM public.webhook_delivery_logs
  WHERE created_at >= now() - interval '30 days';

  v_wh_rate := CASE WHEN v_wh_total > 0 THEN ROUND((v_wh_success::NUMERIC / v_wh_total) * 100, 4) ELSE 100 END;
  v_wh_budget_total := ROUND(v_wh_total * ((100 - p_webhook_slo) / 100.0), 2);
  v_wh_budget_consumed := v_wh_fail;
  v_wh_burn_pct := CASE WHEN v_wh_budget_total > 0 THEN ROUND((v_wh_budget_consumed / v_wh_budget_total) * 100, 2) ELSE 0 END;

  -- API aggregate
  SELECT
    COUNT(*)::BIGINT,
    COUNT(*) FILTER (WHERE status_code BETWEEN 200 AND 399)::BIGINT,
    COUNT(*) FILTER (WHERE status_code >= 400 OR status_code IS NULL)::BIGINT
  INTO v_api_total, v_api_success, v_api_fail
  FROM public.api_request_logs
  WHERE created_at >= now() - interval '30 days';

  v_api_rate := CASE WHEN v_api_total > 0 THEN ROUND((v_api_success::NUMERIC / v_api_total) * 100, 4) ELSE 100 END;
  v_api_budget_total := ROUND(v_api_total * ((100 - p_api_slo) / 100.0), 2);
  v_api_budget_consumed := v_api_fail;
  v_api_burn_pct := CASE WHEN v_api_budget_total > 0 THEN ROUND((v_api_budget_consumed / v_api_budget_total) * 100, 2) ELSE 0 END;

  -- Daily timeline
  WITH days AS (
    SELECT generate_series(
      date_trunc('day', now() - interval '29 days'),
      date_trunc('day', now()),
      interval '1 day'
    ) AS day
  ),
  wh AS (
    SELECT date_trunc('day', created_at) AS day,
           COUNT(*) AS total,
           COUNT(*) FILTER (WHERE success = false) AS fail
    FROM public.webhook_delivery_logs
    WHERE created_at >= now() - interval '30 days'
    GROUP BY 1
  ),
  api AS (
    SELECT date_trunc('day', created_at) AS day,
           COUNT(*) AS total,
           COUNT(*) FILTER (WHERE status_code >= 400 OR status_code IS NULL) AS fail
    FROM public.api_request_logs
    WHERE created_at >= now() - interval '30 days'
    GROUP BY 1
  )
  SELECT jsonb_agg(row_to_json(t) ORDER BY t.day)
  INTO v_timeline
  FROM (
    SELECT
      d.day,
      COALESCE(wh.total, 0) AS webhook_total,
      COALESCE(wh.fail, 0) AS webhook_fail,
      COALESCE(api.total, 0) AS api_total,
      COALESCE(api.fail, 0) AS api_fail
    FROM days d
    LEFT JOIN wh ON wh.day = d.day
    LEFT JOIN api ON api.day = d.day
  ) t;

  v_result := jsonb_build_object(
    'window_days', 30,
    'generated_at', now(),
    'webhook_slo_pct', p_webhook_slo,
    'api_slo_pct', p_api_slo,
    'webhooks', jsonb_build_object(
      'total', v_wh_total,
      'success', v_wh_success,
      'failed', v_wh_fail,
      'success_rate_pct', v_wh_rate,
      'budget_total', v_wh_budget_total,
      'budget_consumed', v_wh_budget_consumed,
      'burn_pct', v_wh_burn_pct,
      'status', CASE
        WHEN v_wh_burn_pct >= 90 THEN 'critical'
        WHEN v_wh_burn_pct >= 75 THEN 'high'
        WHEN v_wh_burn_pct >= 50 THEN 'warning'
        ELSE 'healthy'
      END
    ),
    'external_api', jsonb_build_object(
      'total', v_api_total,
      'success', v_api_success,
      'failed', v_api_fail,
      'success_rate_pct', v_api_rate,
      'budget_total', v_api_budget_total,
      'budget_consumed', v_api_budget_consumed,
      'burn_pct', v_api_burn_pct,
      'status', CASE
        WHEN v_api_burn_pct >= 90 THEN 'critical'
        WHEN v_api_burn_pct >= 75 THEN 'high'
        WHEN v_api_burn_pct >= 50 THEN 'warning'
        ELSE 'healthy'
      END
    ),
    'timeline', COALESCE(v_timeline, '[]'::jsonb)
  );

  RETURN v_result;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_error_budget_30d(NUMERIC, NUMERIC) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_error_budget_30d(NUMERIC, NUMERIC) TO authenticated, service_role;
