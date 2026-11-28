CREATE OR REPLACE FUNCTION public.run_boss_win_rate_alerts(p_days integer DEFAULT NULL::integer)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN PERFORM public._require_admin(); RETURN public.check_boss_win_rate_alerts(p_days); END; $function$
