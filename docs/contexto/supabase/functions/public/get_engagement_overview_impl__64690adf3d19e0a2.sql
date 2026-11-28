CREATE OR REPLACE FUNCTION public.get_engagement_overview_impl(p_department_id uuid DEFAULT NULL::uuid, p_days integer DEFAULT 90)
 RETURNS TABLE(overall_score numeric, overall_favorability numeric, respondents integer, eligible_users integer, participation_rate numeric, answer_count integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH scoped AS (SELECT a.user_id, CASE WHEN q.is_reverse THEN 10 - a.normalized_score ELSE a.normalized_score END AS score, q.weight FROM public.engagement_answers a JOIN public.engagement_question_pool q ON q.id = a.question_id WHERE a.normalized_score IS NOT NULL AND q.weight > 0 AND a.answered_at >= now() - make_interval(days => GREATEST(p_days, 1)) AND (p_department_id IS NULL OR a.department_id = p_department_id)),
  eligible AS (SELECT count(*)::int AS total FROM public.profiles p WHERE p_department_id IS NULL OR EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.user_id = p.id AND tm.department_id = p_department_id)),
  agg AS (SELECT round(sum(score * weight) / NULLIF(sum(weight), 0), 2) AS overall_score, round(100.0 * count(*) FILTER (WHERE score >= 7) / NULLIF(count(*), 0), 1) AS overall_favorability, count(DISTINCT user_id)::int AS respondents, count(*)::int AS answer_count FROM scoped)
  SELECT agg.overall_score, agg.overall_favorability, agg.respondents, eligible.total, round(100.0 * agg.respondents / NULLIF(eligible.total, 0), 1), agg.answer_count FROM agg CROSS JOIN eligible WHERE agg.respondents >= public.engagement_min_respondents();
$function$
