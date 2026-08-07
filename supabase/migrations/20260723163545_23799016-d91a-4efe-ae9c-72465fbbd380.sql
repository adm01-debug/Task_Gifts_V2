-- Retry / invalidation infra for Web Push
ALTER TABLE public.push_subscriptions
  ADD COLUMN IF NOT EXISTS disabled_reason TEXT;

ALTER TABLE public.push_notification_logs
  ADD COLUMN IF NOT EXISTS attempts SMALLINT NOT NULL DEFAULT 1;

-- RPC: increment failure counter and auto-disable after threshold (5 falhas seguidas).
CREATE OR REPLACE FUNCTION public.increment_push_failures(_ids UUID[])
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.push_subscriptions
     SET failure_count = COALESCE(failure_count, 0) + 1,
         updated_at    = now(),
         disabled_at   = CASE
                           WHEN COALESCE(failure_count, 0) + 1 >= 5 THEN now()
                           ELSE disabled_at
                         END,
         disabled_reason = CASE
                             WHEN COALESCE(failure_count, 0) + 1 >= 5
                                  AND disabled_reason IS NULL
                               THEN 'auto_disabled_after_5_failures'
                             ELSE disabled_reason
                           END
   WHERE id = ANY(_ids);
END;
$$;

REVOKE ALL ON FUNCTION public.increment_push_failures(UUID[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_push_failures(UUID[]) TO service_role;

-- RPC: reset failure counter em envio bem-sucedido.
CREATE OR REPLACE FUNCTION public.reset_push_failures(_ids UUID[])
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.push_subscriptions
     SET failure_count = 0,
         last_used_at  = now(),
         updated_at    = now()
   WHERE id = ANY(_ids);
END;
$$;

REVOKE ALL ON FUNCTION public.reset_push_failures(UUID[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reset_push_failures(UUID[]) TO service_role;