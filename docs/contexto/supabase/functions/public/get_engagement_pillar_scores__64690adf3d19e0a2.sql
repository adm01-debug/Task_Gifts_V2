CREATE OR REPLACE FUNCTION public.get_engagement_pillar_scores(p_department_id uuid DEFAULT NULL::uuid, p_days integer DEFAULT 90)
 RETURNS TABLE(pillar climate_pillar, score numeric, favorability numeric, respondents integer, answer_count integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN PERFORM public._guard_manager_or_admin_if_user(); RETURN QUERY SELECT * FROM public.get_engagement_pillar_scores_impl(p_department_id, p_days); END; $function$
