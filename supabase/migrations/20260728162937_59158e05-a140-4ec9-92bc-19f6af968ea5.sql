REVOKE ALL ON FUNCTION public.get_daily_wager() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.submit_daily_wager(uuid, text, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_daily_wager() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.submit_daily_wager(uuid, text, integer) TO authenticated, service_role;