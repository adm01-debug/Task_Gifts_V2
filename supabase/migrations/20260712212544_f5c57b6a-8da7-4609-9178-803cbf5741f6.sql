SELECT cron.schedule(
  'security-weekly-digest',
  '0 13 * * 1',
  $$
  SELECT net.http_post(
    url := 'https://awzhgfmqwddzgbqzqusc.supabase.co/functions/v1/security-weekly-digest',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := '{}'::jsonb
  );
  $$
);