
DO $$
DECLARE
  v_url TEXT := 'https://awzhgfmqwddzgbqzqusc.supabase.co/functions/v1/webhook-health-monitor';
  v_anon TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3emhnZm1xd2RkemdicXpxdXNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2ODE1ODQsImV4cCI6MjA5NDI1NzU4NH0.HIsoaKjV2MFzTc6sCJ0p6RcoVIPR5SRIoE885SVMXCc';
BEGIN
  PERFORM cron.unschedule('webhook-health-monitor-every-15min')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'webhook-health-monitor-every-15min');

  PERFORM cron.schedule(
    'webhook-health-monitor-every-15min',
    '*/15 * * * *',
    format($cmd$
      SELECT net.http_post(
        url := %L,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || %L,
          'x-request-id', 'cron-' || gen_random_uuid()::text
        ),
        body := '{}'::jsonb
      );
    $cmd$, v_url, v_anon)
  );
END $$;
