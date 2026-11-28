CREATE OR REPLACE FUNCTION public.get_nr1_summary_impl(p_department_id uuid DEFAULT NULL::uuid, p_days integer DEFAULT 90)
 RETURNS TABLE(categories_evaluated integer, critical_count integer, high_count integer, moderate_count integer, low_count integer, avg_risk_grade numeric, max_risk_grade numeric)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH m AS (SELECT * FROM public.get_nr1_risk_matrix(p_department_id, p_days))
  SELECT
    count(*)::int,
    count(*) FILTER (WHERE risk_level = 'critical')::int,
    count(*) FILTER (WHERE risk_level = 'high')::int,
    count(*) FILTER (WHERE risk_level = 'moderate')::int,
    count(*) FILTER (WHERE risk_level = 'low')::int,
    round(avg(risk_grade), 2),
    round(max(risk_grade), 2)
  FROM m;
$function$
