GRANT SELECT, INSERT, UPDATE, DELETE ON public.webhook_idempotency TO service_role;

CREATE INDEX IF NOT EXISTS webhook_idempotency_expires_at_idx
  ON public.webhook_idempotency (expires_at);

CREATE INDEX IF NOT EXISTS webhook_idempotency_provider_created_idx
  ON public.webhook_idempotency (provider, created_at DESC);