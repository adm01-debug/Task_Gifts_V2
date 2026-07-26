-- Histórico curto de sincronizações do dispositivo (push).
CREATE TABLE public.push_sync_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.push_subscriptions(id) ON DELETE SET NULL,
  endpoint TEXT,
  device_label TEXT,
  event TEXT NOT NULL CHECK (event IN ('subscribed','refreshed','renamed','disabled','failed')),
  detail TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.push_sync_events TO authenticated;
GRANT ALL ON public.push_sync_events TO service_role;

ALTER TABLE public.push_sync_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own push sync events"
  ON public.push_sync_events FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own push sync events"
  ON public.push_sync_events FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX push_sync_events_user_recent_idx
  ON public.push_sync_events (user_id, created_at DESC);

-- Retenção: mantém apenas os 20 eventos mais recentes por usuário.
CREATE OR REPLACE FUNCTION public.trim_push_sync_events()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.push_sync_events e
  WHERE e.user_id = NEW.user_id
    AND e.id NOT IN (
      SELECT id FROM public.push_sync_events
      WHERE user_id = NEW.user_id
      ORDER BY created_at DESC
      LIMIT 20
    );
  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.trim_push_sync_events() FROM PUBLIC, anon;

CREATE TRIGGER trg_trim_push_sync_events
AFTER INSERT ON public.push_sync_events
FOR EACH ROW EXECUTE FUNCTION public.trim_push_sync_events();