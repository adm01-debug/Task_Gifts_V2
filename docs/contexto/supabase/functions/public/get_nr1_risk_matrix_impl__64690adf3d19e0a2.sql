CREATE OR REPLACE FUNCTION public.get_nr1_risk_matrix_impl(p_department_id uuid DEFAULT NULL::uuid, p_days integer DEFAULT 90)
 RETURNS TABLE(category_id uuid, category_key text, category_name text, description text, legal_reference text, severity_weight numeric, score numeric, probability numeric, risk_grade numeric, risk_level text, respondents integer, factors_evaluated integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH factor_scores AS (
    SELECT * FROM public.get_engagement_factor_scores(p_department_id, p_days)
  ), agg AS (
    SELECT
      c.id, c.key, c.name, c.description, c.legal_reference, c.severity_weight, c.order_index,
      round(sum(fs.score * m.weight) / NULLIF(sum(m.weight), 0), 2) AS score,
      max(fs.respondents)::int AS respondents,
      count(*)::int AS factors_evaluated
    FROM public.nr1_risk_categories c
    JOIN public.nr1_factor_mappings m ON m.category_id = c.id
    JOIN factor_scores fs ON fs.factor_id = m.factor_id
    WHERE c.is_active
    GROUP BY c.id, c.key, c.name, c.description, c.legal_reference, c.severity_weight, c.order_index
  )
  SELECT
    a.id, a.key, a.name, a.description, a.legal_reference, a.severity_weight,
    a.score,
    round(10 - a.score, 2) AS probability,
    round((10 - a.score) * a.severity_weight, 2) AS risk_grade,
    CASE
      WHEN (10 - a.score) * a.severity_weight >= 15 THEN 'critical'
      WHEN (10 - a.score) * a.severity_weight >= 9 THEN 'high'
      WHEN (10 - a.score) * a.severity_weight >= 4.5 THEN 'moderate'
      ELSE 'low'
    END AS risk_level,
    a.respondents, a.factors_evaluated
  FROM agg a
  ORDER BY (10 - a.score) * a.severity_weight DESC, a.order_index ASC;
$function$
