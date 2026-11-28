CREATE OR REPLACE FUNCTION public.get_engagement_overview(p_department_id uuid DEFAULT NULL::uuid, p_days integer DEFAULT 90)
 RETURNS TABLE(overall_score numeric, overall_favorability numeric, respondents integer, eligible_users integer, participation_rate numeric, answer_count integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN PERFORM public._guard_manager_or_admin_if_user(); RETURN QUERY SELECT * FROM public.get_engagement_overview_impl(p_department_id, p_days); END; $function$
