CREATE OR REPLACE FUNCTION public.get_engagement_nps_history(p_department_id uuid DEFAULT NULL::uuid, p_months integer DEFAULT 12, p_bucket text DEFAULT 'month'::text)
 RETURNS TABLE(metric text, period_start date, score integer, promoters integer, passives integer, detractors integer, respondents integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN PERFORM public._guard_manager_or_admin_if_user(); RETURN QUERY SELECT * FROM public.get_engagement_nps_history_impl(p_department_id, p_months, p_bucket); END; $function$
