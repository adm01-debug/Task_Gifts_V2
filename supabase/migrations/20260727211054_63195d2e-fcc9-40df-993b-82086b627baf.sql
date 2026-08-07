REVOKE ALL ON FUNCTION public.snapshot_lucky_wheel_payout(date) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.snapshot_lucky_wheel_payout(date) TO service_role;