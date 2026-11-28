CREATE OR REPLACE FUNCTION public.get_engagement_pillar_correlations_impl(p_days integer DEFAULT 180)
 RETURNS TABLE(pillar_a climate_pillar, pillar_b climate_pillar, correlation numeric, sample_size integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH per_user AS (SELECT a.user_id, q.pillar, avg(CASE WHEN q.is_reverse THEN 10 - a.normalized_score ELSE a.normalized_score END) AS score FROM public.engagement_answers a JOIN public.engagement_question_pool q ON q.id = a.question_id WHERE a.normalized_score IS NOT NULL AND a.answered_at >= now() - make_interval(days => GREATEST(p_days, 1)) GROUP BY a.user_id, q.pillar),
  pairs AS (SELECT x.pillar AS pillar_a, y.pillar AS pillar_b, x.score AS sa, y.score AS sb FROM per_user x JOIN per_user y ON y.user_id = x.user_id AND y.pillar > x.pillar)
  SELECT pillar_a, pillar_b, round(corr(sa, sb)::numeric, 3) AS correlation, count(*)::int AS sample_size FROM pairs GROUP BY pillar_a, pillar_b HAVING count(*) >= public.engagement_min_respondents() ORDER BY abs(corr(sa, sb)) DESC NULLS LAST;
$function$
