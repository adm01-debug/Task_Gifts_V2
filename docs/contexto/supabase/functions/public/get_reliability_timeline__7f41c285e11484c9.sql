CREATE OR REPLACE FUNCTION public.get_reliability_timeline(p_hours integer DEFAULT 24)
 RETURNS TABLE(bucket timestamp with time zone, webhook_total bigint, webhook_success bigint, webhook_p95_ms integer, api_total bigint, api_errors bigint, api_p95_ms integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
