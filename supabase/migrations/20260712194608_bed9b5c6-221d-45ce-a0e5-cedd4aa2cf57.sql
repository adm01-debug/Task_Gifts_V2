
CREATE OR REPLACE FUNCTION public.get_webhook_delivery_stats_1h()
RETURNS TABLE (
  subscription_id UUID,
  subscription_name TEXT,
  subscription_url TEXT,
  total_deliveries BIGINT,
  successful_deliveries BIGINT,
  failed_deliveries BIGINT,
  success_rate_pct NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    s.id AS subscription_id,
    s.name AS subscription_name,
    s.url AS subscription_url,
    COUNT(l.id)::BIGINT AS total_deliveries,
    COUNT(l.id) FILTER (WHERE l.success)::BIGINT AS successful_deliveries,
    COUNT(l.id) FILTER (WHERE NOT l.success)::BIGINT AS failed_deliveries,
    CASE WHEN COUNT(l.id) > 0
      THEN ROUND((COUNT(l.id) FILTER (WHERE l.success)::NUMERIC / COUNT(l.id)) * 100, 2)
      ELSE NULL
    END AS success_rate_pct
  FROM public.webhook_subscriptions s
  LEFT JOIN public.webhook_delivery_logs l
    ON l.subscription_id = s.id
   AND l.created_at >= now() - interval '1 hour'
  WHERE current_setting('request.jwt.claim.role', true) = 'service_role'
     OR public.has_role(auth.uid(), 'admin'::app_role)
  GROUP BY s.id, s.name, s.url;
$$;

REVOKE EXECUTE ON FUNCTION public.get_webhook_delivery_stats_1h() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_webhook_delivery_stats_1h() TO authenticated, service_role;
