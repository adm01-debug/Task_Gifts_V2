CREATE OR REPLACE FUNCTION public.check_boss_win_rate_alerts(p_days integer DEFAULT NULL::integer)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN PERFORM public._guard_manager_or_admin_if_user(); RETURN public.check_boss_win_rate_alerts_impl(p_days); END; $function$
