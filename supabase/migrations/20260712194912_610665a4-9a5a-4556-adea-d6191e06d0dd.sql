
CREATE OR REPLACE FUNCTION public.get_webhook_delivery_logs(
  p_subscription_id UUID,
  p_limit INT DEFAULT 100
)
RETURNS TABLE (
  id UUID,
  event_type TEXT,
  response_status INT,
  success BOOLEAN,
  error_message TEXT,
  attempt_count INT,
  duration_ms INT,
  response_body TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    l.id,
    l.event_type,
    l.response_status,
    l.success,
    l.error_message,
    l.attempt_count,
    l.duration_ms,
    l.response_body,
    l.payload,
    l.created_at
  FROM public.webhook_delivery_logs l
  WHERE l.subscription_id = p_subscription_id
    AND (
      current_setting('request.jwt.claim.role', true) = 'service_role'
      OR public.has_role(auth.uid(), 'admin'::app_role)
    )
  ORDER BY l.created_at DESC
  LIMIT LEAST(GREATEST(p_limit, 1), 500);
$$;

REVOKE EXECUTE ON FUNCTION public.get_webhook_delivery_logs(UUID, INT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_webhook_delivery_logs(UUID, INT) TO authenticated, service_role;
