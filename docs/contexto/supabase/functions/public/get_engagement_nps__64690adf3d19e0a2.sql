CREATE OR REPLACE FUNCTION public.get_engagement_nps(p_department_id uuid DEFAULT NULL::uuid, p_days integer DEFAULT 90)
 RETURNS TABLE(metric text, score integer, promoters integer, passives integer, detractors integer, respondents integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN PERFORM public._guard_manager_or_admin_if_user(); RETURN QUERY SELECT * FROM public.get_engagement_nps_impl(p_department_id, p_days); END; $function$
