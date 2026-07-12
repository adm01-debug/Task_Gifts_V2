CREATE INDEX IF NOT EXISTS idx_webhook_delivery_logs_subscription_created
ON public.webhook_delivery_logs (subscription_id, created_at DESC);

ANALYZE public.webhook_delivery_logs;