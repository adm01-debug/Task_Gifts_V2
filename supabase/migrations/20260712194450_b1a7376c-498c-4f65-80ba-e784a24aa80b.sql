
CREATE OR REPLACE FUNCTION public.get_webhook_delivery_hourly_24h()
RETURNS TABLE (
  bucket TIMESTAMPTZ,
  total BIGINT,
  successful BIGINT,
  failed BIGINT,
  avg_duration_ms NUMERIC,
  p95_duration_ms NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH hours AS (
    SELECT generate_series(
      date_trunc('hour', now() - interval '23 hours'),
      date_trunc('hour', now()),
      interval '1 hour'
    ) AS bucket
  )
  SELECT
    h.bucket,
    COALESCE(COUNT(l.id), 0)::BIGINT AS total,
    COALESCE(SUM(CASE WHEN l.success THEN 1 ELSE 0 END), 0)::BIGINT AS successful,
    COALESCE(SUM(CASE WHEN NOT l.success THEN 1 ELSE 0 END), 0)::BIGINT AS failed,
    ROUND(AVG(l.duration_ms)::NUMERIC, 2) AS avg_duration_ms,
    ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY l.duration_ms)::NUMERIC, 2) AS p95_duration_ms
  FROM hours h
  LEFT JOIN public.webhook_delivery_logs l
    ON date_trunc('hour', l.created_at) = h.bucket
   AND l.created_at >= now() - interval '24 hours'
  WHERE public.has_role(auth.uid(), 'admin'::app_role)
  GROUP BY h.bucket
  ORDER BY h.bucket ASC;
$$;

REVOKE EXECUTE ON FUNCTION public.get_webhook_delivery_hourly_24h() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_webhook_delivery_hourly_24h() TO authenticated;
