SELECT cron.unschedule('close-expired-auctions')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'close-expired-auctions');

SELECT cron.schedule(
  'close-expired-auctions',
  '*/5 * * * *',
  $$SELECT public.close_expired_auctions();$$
);