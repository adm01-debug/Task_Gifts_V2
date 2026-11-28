CREATE OR REPLACE FUNCTION public.get_engagement_pillar_benchmark(p_department_id uuid DEFAULT NULL::uuid, p_days integer DEFAULT 90, p_industry text DEFAULT 'geral'::text, p_company_size text DEFAULT 'all'::text, p_region text DEFAULT 'BR'::text)
 RETURNS TABLE(pillar climate_pillar, score numeric, favorability numeric, respondents integer, benchmark_average numeric, benchmark_top_quartile numeric, benchmark_top_10 numeric, benchmark_sample_size integer, benchmark_industry text, benchmark_company_size text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN PERFORM public._guard_manager_or_admin_if_user(); RETURN QUERY SELECT * FROM public.get_engagement_pillar_benchmark_impl(p_department_id, p_days, p_industry, p_company_size, p_region); END; $function$
