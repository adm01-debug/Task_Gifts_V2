
CREATE TABLE public.push_notification_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  subscription_id UUID NULL REFERENCES public.push_subscriptions(id) ON DELETE SET NULL,
  endpoint TEXT NULL,
  device_label TEXT NULL,
  campaign_id UUID NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  url TEXT NULL,
  status TEXT NOT NULL CHECK (status IN ('sent','failed','invalidated','skipped')),
  status_code INT NULL,
  error TEXT NULL,
  data JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_push_logs_user_created ON public.push_notification_logs (user_id, created_at DESC);
CREATE INDEX idx_push_logs_subscription ON public.push_notification_logs (subscription_id);
CREATE INDEX idx_push_logs_campaign ON public.push_notification_logs (campaign_id);

GRANT SELECT ON public.push_notification_logs TO authenticated;
GRANT ALL ON public.push_notification_logs TO service_role;

ALTER TABLE public.push_notification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own push logs"
  ON public.push_notification_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
