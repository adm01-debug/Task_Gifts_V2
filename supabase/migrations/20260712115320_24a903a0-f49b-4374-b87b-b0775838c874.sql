-- Fase 21: Automação de limpeza periódica via pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Unschedule defensivo (evita duplicação em re-execução)
DO $$
DECLARE
  v_jobname TEXT;
BEGIN
  FOREACH v_jobname IN ARRAY ARRAY[
    'daily-cleanup-security-logs-90d',
    'daily-cleanup-security-logs-30d',
    'daily-cleanup-idempotency',
    'weekly-cleanup-expired-challenges'
  ] LOOP
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = v_jobname) THEN
      PERFORM cron.unschedule(v_jobname);
    END IF;
  END LOOP;
END $$;

-- Job 1: limpeza 90d (security_logs + bitrix24_webhook_logs) — diário 03:15 UTC
SELECT cron.schedule(
  'daily-cleanup-security-logs-90d',
  '15 3 * * *',
  $$SELECT public.cleanup_old_security_logs();$$
);

-- Job 2: limpeza 30d (rate_limit_logs, login_attempts, session_logs, blocked_ips expirados) — diário 03:20 UTC
SELECT cron.schedule(
  'daily-cleanup-security-logs-30d',
  '20 3 * * *',
  $$SELECT public.cleanup_old_security_logs(30);$$
);

-- Job 3: limpeza de chaves de idempotência expiradas — diário 03:25 UTC
SELECT cron.schedule(
  'daily-cleanup-idempotency',
  '25 3 * * *',
  $$SELECT public.cleanup_expired_idempotency_keys();$$
);

-- Job 4: limpeza de desafios WebAuthn expirados — semanal (domingo) 03:30 UTC
SELECT cron.schedule(
  'weekly-cleanup-expired-challenges',
  '30 3 * * 0',
  $$SELECT public.cleanup_expired_challenges();$$
);