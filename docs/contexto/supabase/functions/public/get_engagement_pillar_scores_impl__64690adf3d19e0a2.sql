CREATE OR REPLACE FUNCTION public.get_engagement_pillar_scores_impl(p_department_id uuid DEFAULT NULL::uuid, p_days integer DEFAULT 90)
 RETURNS TABLE(pillar climate_pillar, score numeric, favorability numeric, respondents integer, answer_count integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH scoped AS (SELECT q.pillar, a.user_id, CASE WHEN q.is_reverse THEN 10 - a.normalized_score ELSE a.normalized_score END AS score, q.weight FROM public.engagement_answers a JOIN public.engagement_question_pool q ON q.id = a.question_id WHERE a.normalized_score IS NOT NULL AND q.weight > 0 AND a.answered_at >= now() - make_interval(days => GREATEST(p_days, 1)) AND (p_department_id IS NULL OR a.department_id = p_department_id)),
  agg AS (SELECT s.pillar, round(sum(s.score * s.weight) / NULLIF(sum(s.weight), 0), 2) AS score, round(100.0 * count(*) FILTER (WHERE s.score >= 7) / NULLIF(count(*), 0), 1) AS favorability, count(DISTINCT s.user_id)::int AS respondents, count(*)::int AS answer_count FROM scoped s GROUP BY s.pillar)
  SELECT * FROM agg WHERE respondents >= public.engagement_min_respondents() ORDER BY score ASC NULLS LAST;
$function$
