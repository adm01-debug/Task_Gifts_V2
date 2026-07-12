
-- Phase 28: Webhook delivery observability view (24h rolling window)

CREATE OR REPLACE VIEW public.webhook_delivery_stats_24h
WITH (security_invoker = true) AS
SELECT
  wdl.subscription_id,
  ws.name AS subscription_name,
  ws.url AS subscription_url,
  COUNT(*)::bigint AS total_deliveries,
  COUNT(*) FILTER (WHERE wdl.success)::bigint AS successful_deliveries,
  COUNT(*) FILTER (WHERE NOT wdl.success)::bigint AS failed_deliveries,
  ROUND(
    (COUNT(*) FILTER (WHERE wdl.success)::numeric / NULLIF(COUNT(*), 0)::numeric) * 100,
    2
  ) AS success_rate_pct,
  ROUND(AVG(wdl.duration_ms)::numeric, 2) AS avg_duration_ms,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY wdl.duration_ms)::numeric(10,2) AS p50_duration_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY wdl.duration_ms)::numeric(10,2) AS p95_duration_ms,
  PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY wdl.duration_ms)::numeric(10,2) AS p99_duration_ms,
  MAX(wdl.duration_ms) AS max_duration_ms,
  ROUND(AVG(wdl.attempt_count)::numeric, 2) AS avg_attempts,
  MAX(wdl.created_at) AS last_delivery_at
FROM public.webhook_delivery_logs wdl
LEFT JOIN public.webhook_subscriptions ws ON ws.id = wdl.subscription_id
WHERE wdl.created_at >= now() - INTERVAL '24 hours'
GROUP BY wdl.subscription_id, ws.name, ws.url;

REVOKE ALL ON public.webhook_delivery_stats_24h FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.webhook_delivery_stats_24h TO service_role;

-- Admin-facing RPC (security definer with role check)
CREATE OR REPLACE FUNCTION public.get_webhook_delivery_stats_24h()
RETURNS TABLE (
  subscription_id uuid,
  subscription_name text,
  subscription_url text,
  total_deliveries bigint,
  successful_deliveries bigint,
  failed_deliveries bigint,
  success_rate_pct numeric,
  avg_duration_ms numeric,
  p50_duration_ms numeric,
  p95_duration_ms numeric,
  p99_duration_ms numeric,
  max_duration_ms integer,
  avg_attempts numeric,
  last_delivery_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'access_denied: admin role required';
  END IF;

  RETURN QUERY SELECT * FROM public.webhook_delivery_stats_24h;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_webhook_delivery_stats_24h() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_webhook_delivery_stats_24h() TO authenticated, service_role;
