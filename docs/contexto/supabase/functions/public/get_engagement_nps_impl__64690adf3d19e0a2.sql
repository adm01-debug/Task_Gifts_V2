CREATE OR REPLACE FUNCTION public.get_engagement_nps_impl(p_department_id uuid DEFAULT NULL::uuid, p_days integer DEFAULT 90)
 RETURNS TABLE(metric text, score integer, promoters integer, passives integer, detractors integer, respondents integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH scoped AS (SELECT CASE WHEN q.code = 'orgulho_empresa_2' THEN 'eNPS' ELSE 'LNPS' END AS metric, a.user_id, a.normalized_score AS score FROM public.engagement_answers a JOIN public.engagement_question_pool q ON q.id = a.question_id WHERE q.code IN ('orgulho_empresa_2', 'suporte_lideranca_5') AND a.normalized_score IS NOT NULL AND a.answered_at >= now() - make_interval(days => GREATEST(p_days, 1)) AND (p_department_id IS NULL OR a.department_id = p_department_id)),
  agg AS (SELECT s.metric, count(*) FILTER (WHERE s.score >= 9)::int AS promoters, count(*) FILTER (WHERE s.score >= 7 AND s.score < 9)::int AS passives, count(*) FILTER (WHERE s.score <= 6)::int AS detractors, count(DISTINCT s.user_id)::int AS respondents, count(*)::int AS total FROM scoped s GROUP BY s.metric)
  SELECT metric, round(100.0 * (promoters - detractors) / NULLIF(total, 0))::int AS score, promoters, passives, detractors, respondents FROM agg WHERE respondents >= public.engagement_min_respondents();
$function$
