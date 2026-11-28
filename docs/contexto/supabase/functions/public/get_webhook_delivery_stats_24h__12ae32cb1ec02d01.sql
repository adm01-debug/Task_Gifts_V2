CREATE OR REPLACE FUNCTION public.get_webhook_delivery_stats_24h()
 RETURNS TABLE(subscription_id uuid, subscription_name text, subscription_url text, total_deliveries bigint, successful_deliveries bigint, failed_deliveries bigint, success_rate_pct numeric, avg_duration_ms numeric, p50_duration_ms numeric, p95_duration_ms numeric, p99_duration_ms numeric, max_duration_ms integer, avg_attempts numeric, last_delivery_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'access_denied: admin role required';
  END IF;

  RETURN QUERY SELECT * FROM public.webhook_delivery_stats_24h;
END;
$function$
