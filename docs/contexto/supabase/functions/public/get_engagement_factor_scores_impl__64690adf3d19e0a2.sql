CREATE OR REPLACE FUNCTION public.get_engagement_factor_scores_impl(p_department_id uuid DEFAULT NULL::uuid, p_days integer DEFAULT 90)
 RETURNS TABLE(factor_id uuid, factor_key text, factor_name text, pillar climate_pillar, score numeric, favorability numeric, respondents integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH scoped AS (SELECT f.id AS factor_id, f.key AS factor_key, f.name AS factor_name, f.pillar, a.user_id, CASE WHEN q.is_reverse THEN 10 - a.normalized_score ELSE a.normalized_score END AS score, q.weight FROM public.engagement_answers a JOIN public.engagement_question_pool q ON q.id = a.question_id JOIN public.engagement_factors f ON f.id = q.factor_id WHERE a.normalized_score IS NOT NULL AND q.weight > 0 AND a.answered_at >= now() - make_interval(days => GREATEST(p_days, 1)) AND (p_department_id IS NULL OR a.department_id = p_department_id)),
  agg AS (SELECT s.factor_id, s.factor_key, s.factor_name, s.pillar, round(sum(s.score * s.weight) / NULLIF(sum(s.weight), 0), 2) AS score, round(100.0 * count(*) FILTER (WHERE s.score >= 7) / NULLIF(count(*), 0), 1) AS favorability, count(DISTINCT s.user_id)::int AS respondents FROM scoped s GROUP BY s.factor_id, s.factor_key, s.factor_name, s.pillar)
  SELECT * FROM agg WHERE respondents >= public.engagement_min_respondents() ORDER BY score ASC NULLS LAST;
$function$
