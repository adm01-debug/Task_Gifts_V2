CREATE OR REPLACE FUNCTION public.recalc_campaign_teams(_campaign_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN PERFORM public._guard_manager_or_admin_if_user(); PERFORM public.recalc_campaign_teams_impl(_campaign_id); END; $function$
