CREATE OR REPLACE FUNCTION public.get_engagement_nps_history(
  p_department_id uuid DEFAULT NULL,
  p_months integer DEFAULT 12,
  p_bucket text DEFAULT 'month'
)
RETURNS TABLE(
  metric text,
  period_start date,
  score integer,
  promoters integer,
  passives integer,
  detractors integer,
  respondents integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  WITH params AS (
    SELECT
      CASE WHEN lower(coalesce(p_bucket, 'month')) = 'week' THEN 'week' ELSE 'month' END AS bucket,
      LEAST(GREATEST(coalesce(p_months, 12), 1), 36) AS months
  ), scoped AS (
    SELECT
      CASE WHEN q.code = 'orgulho_empresa_2' THEN 'eNPS' ELSE 'LNPS' END AS metric,
      date_trunc((SELECT bucket FROM params), a.answered_at)::date AS period_start,
      a.user_id,
      a.normalized_score AS score
    FROM public.engagement_answers a
    JOIN public.engagement_question_pool q ON q.id = a.question_id
    CROSS JOIN params p
    WHERE q.code IN ('orgulho_empresa_2', 'suporte_lideranca_5')
      AND a.normalized_score IS NOT NULL
      AND a.answered_at >= date_trunc(p.bucket, now()) - make_interval(months => p.months)
      AND (p_department_id IS NULL OR a.department_id = p_department_id)
  ), agg AS (
    SELECT
      s.metric,
      s.period_start,
      count(*) FILTER (WHERE s.score >= 9)::int AS promoters,
      count(*) FILTER (WHERE s.score >= 7 AND s.score < 9)::int AS passives,
      count(*) FILTER (WHERE s.score <= 6)::int AS detractors,
      count(DISTINCT s.user_id)::int AS respondents,
      count(*)::int AS total
    FROM scoped s
    GROUP BY s.metric, s.period_start
  )
  SELECT
    a.metric,
    a.period_start,
    round(100.0 * (a.promoters - a.detractors) / NULLIF(a.total, 0))::int AS score,
    a.promoters,
    a.passives,
    a.detractors,
    a.respondents
  FROM agg a
  WHERE a.respondents >= public.engagement_min_respondents()
  ORDER BY a.metric, a.period_start;
$function$;

REVOKE ALL ON FUNCTION public.get_engagement_nps_history(uuid, integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_engagement_nps_history(uuid, integer, text) TO authenticated, service_role;