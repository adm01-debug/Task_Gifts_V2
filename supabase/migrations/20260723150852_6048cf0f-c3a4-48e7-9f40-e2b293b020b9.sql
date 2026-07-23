
CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION public.close_expired_sales_campaigns()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected integer;
BEGIN
  UPDATE public.sales_campaigns
     SET status = 'completed',
         updated_at = now()
   WHERE status = 'active'
     AND end_date < CURRENT_DATE;
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;

REVOKE ALL ON FUNCTION public.close_expired_sales_campaigns() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.close_expired_sales_campaigns() TO service_role;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'close-expired-sales-campaigns') THEN
    PERFORM cron.unschedule('close-expired-sales-campaigns');
  END IF;
  PERFORM cron.schedule(
    'close-expired-sales-campaigns',
    '15 0 * * *',
    $cron$ SELECT public.close_expired_sales_campaigns(); $cron$
  );
END $$;
