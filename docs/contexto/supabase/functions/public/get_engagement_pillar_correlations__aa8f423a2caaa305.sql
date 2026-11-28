CREATE OR REPLACE FUNCTION public.get_engagement_pillar_correlations(p_days integer DEFAULT 180)
 RETURNS TABLE(pillar_a climate_pillar, pillar_b climate_pillar, correlation numeric, sample_size integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN PERFORM public._guard_manager_or_admin_if_user(); RETURN QUERY SELECT * FROM public.get_engagement_pillar_correlations_impl(p_days); END; $function$
