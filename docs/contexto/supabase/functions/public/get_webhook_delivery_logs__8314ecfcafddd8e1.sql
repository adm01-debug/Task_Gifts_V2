CREATE OR REPLACE FUNCTION public.get_webhook_delivery_logs(p_subscription_id uuid, p_limit integer DEFAULT 100)
 RETURNS TABLE(id uuid, event_type text, response_status integer, success boolean, error_message text, attempt_count integer, duration_ms integer, response_body text, payload jsonb, created_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    l.id, l.event_type, l.response_status, l.success, l.error_message,
    l.attempt_count, l.duration_ms, l.response_body, l.payload, l.created_at
  FROM public.webhook_delivery_logs l
  WHERE l.subscription_id = p_subscription_id
    AND (
      current_setting('request.jwt.claim.role', true) = 'service_role'
      OR public.has_role(auth.uid(), 'admin'::app_role)
    )
  ORDER BY l.created_at DESC
  LIMIT LEAST(GREATEST(p_limit, 1), 500);
$function$
