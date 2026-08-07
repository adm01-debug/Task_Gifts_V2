-- Mínimo de respondentes para qualquer recorte (guarda de anonimato)
CREATE OR REPLACE FUNCTION public.engagement_min_respondents()
RETURNS INTEGER LANGUAGE sql IMMUTABLE SET search_path = public AS $$ SELECT 5 $$;

REVOKE EXECUTE ON FUNCTION public.engagement_min_respondents() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.engagement_min_respondents() TO authenticated, service_role;

-- ============ SCORE POR PILAR ============
CREATE OR REPLACE FUNCTION public.get_engagement_pillar_scores(
  p_department_id UUID DEFAULT NULL,
  p_days INTEGER DEFAULT 90
)
RETURNS TABLE (
  pillar public.climate_pillar,
  score NUMERIC,
  favorability NUMERIC,
  respondents INTEGER,
  answer_count INTEGER
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH scoped AS (
    SELECT
      q.pillar,
      a.user_id,
      CASE WHEN q.is_reverse THEN 10 - a.normalized_score ELSE a.normalized_score END AS score,
      q.weight
    FROM public.engagement_answers a
    JOIN public.engagement_question_pool q ON q.id = a.question_id
    WHERE a.normalized_score IS NOT NULL
      AND q.weight > 0
      AND a.answered_at >= now() - make_interval(days => GREATEST(p_days, 1))
      AND (p_department_id IS NULL OR a.department_id = p_department_id)
  ), agg AS (
    SELECT
      s.pillar,
      round(sum(s.score * s.weight) / NULLIF(sum(s.weight), 0), 2) AS score,
      round(100.0 * count(*) FILTER (WHERE s.score >= 7) / NULLIF(count(*), 0), 1) AS favorability,
      count(DISTINCT s.user_id)::int AS respondents,
      count(*)::int AS answer_count
    FROM scoped s
    GROUP BY s.pillar
  )
  SELECT * FROM agg
  WHERE respondents >= public.engagement_min_respondents()
  ORDER BY score ASC NULLS LAST;
$$;

REVOKE EXECUTE ON FUNCTION public.get_engagement_pillar_scores(UUID, INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_engagement_pillar_scores(UUID, INTEGER) TO authenticated, service_role;

-- ============ SCORE POR FATOR ============
CREATE OR REPLACE FUNCTION public.get_engagement_factor_scores(
  p_department_id UUID DEFAULT NULL,
  p_days INTEGER DEFAULT 90
)
RETURNS TABLE (
  factor_id UUID,
  factor_key TEXT,
  factor_name TEXT,
  pillar public.climate_pillar,
  score NUMERIC,
  favorability NUMERIC,
  respondents INTEGER
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH scoped AS (
    SELECT
      f.id AS factor_id, f.key AS factor_key, f.name AS factor_name, f.pillar,
      a.user_id,
      CASE WHEN q.is_reverse THEN 10 - a.normalized_score ELSE a.normalized_score END AS score,
      q.weight
    FROM public.engagement_answers a
    JOIN public.engagement_question_pool q ON q.id = a.question_id
    JOIN public.engagement_factors f ON f.id = q.factor_id
    WHERE a.normalized_score IS NOT NULL
      AND q.weight > 0
      AND a.answered_at >= now() - make_interval(days => GREATEST(p_days, 1))
      AND (p_department_id IS NULL OR a.department_id = p_department_id)
  ), agg AS (
    SELECT
      s.factor_id, s.factor_key, s.factor_name, s.pillar,
      round(sum(s.score * s.weight) / NULLIF(sum(s.weight), 0), 2) AS score,
      round(100.0 * count(*) FILTER (WHERE s.score >= 7) / NULLIF(count(*), 0), 1) AS favorability,
      count(DISTINCT s.user_id)::int AS respondents
    FROM scoped s
    GROUP BY s.factor_id, s.factor_key, s.factor_name, s.pillar
  )
  SELECT * FROM agg
  WHERE respondents >= public.engagement_min_respondents()
  ORDER BY score ASC NULLS LAST;
$$;

REVOKE EXECUTE ON FUNCTION public.get_engagement_factor_scores(UUID, INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_engagement_factor_scores(UUID, INTEGER) TO authenticated, service_role;

-- ============ eNPS / LNPS ============
CREATE OR REPLACE FUNCTION public.get_engagement_nps(
  p_department_id UUID DEFAULT NULL,
  p_days INTEGER DEFAULT 90
)
RETURNS TABLE (
  metric TEXT,
  score INTEGER,
  promoters INTEGER,
  passives INTEGER,
  detractors INTEGER,
  respondents INTEGER
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH scoped AS (
    SELECT
      CASE WHEN q.code = 'orgulho_empresa_2' THEN 'eNPS' ELSE 'LNPS' END AS metric,
      a.user_id,
      a.normalized_score AS score
    FROM public.engagement_answers a
    JOIN public.engagement_question_pool q ON q.id = a.question_id
    WHERE q.code IN ('orgulho_empresa_2', 'suporte_lideranca_5')
      AND a.normalized_score IS NOT NULL
      AND a.answered_at >= now() - make_interval(days => GREATEST(p_days, 1))
      AND (p_department_id IS NULL OR a.department_id = p_department_id)
  ), agg AS (
    SELECT
      s.metric,
      count(*) FILTER (WHERE s.score >= 9)::int AS promoters,
      count(*) FILTER (WHERE s.score >= 7 AND s.score < 9)::int AS passives,
      count(*) FILTER (WHERE s.score <= 6)::int AS detractors,
      count(DISTINCT s.user_id)::int AS respondents,
      count(*)::int AS total
    FROM scoped s
    GROUP BY s.metric
  )
  SELECT
    metric,
    round(100.0 * (promoters - detractors) / NULLIF(total, 0))::int AS score,
    promoters, passives, detractors, respondents
  FROM agg
  WHERE respondents >= public.engagement_min_respondents();
$$;

REVOKE EXECUTE ON FUNCTION public.get_engagement_nps(UUID, INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_engagement_nps(UUID, INTEGER) TO authenticated, service_role;

-- ============ CORRELAÇÃO ENTRE PILARES ============
CREATE OR REPLACE FUNCTION public.get_engagement_pillar_correlations(
  p_days INTEGER DEFAULT 180
)
RETURNS TABLE (
  pillar_a public.climate_pillar,
  pillar_b public.climate_pillar,
  correlation NUMERIC,
  sample_size INTEGER
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH per_user AS (
    SELECT
      a.user_id,
      q.pillar,
      avg(CASE WHEN q.is_reverse THEN 10 - a.normalized_score ELSE a.normalized_score END) AS score
    FROM public.engagement_answers a
    JOIN public.engagement_question_pool q ON q.id = a.question_id
    WHERE a.normalized_score IS NOT NULL
      AND a.answered_at >= now() - make_interval(days => GREATEST(p_days, 1))
    GROUP BY a.user_id, q.pillar
  ), pairs AS (
    SELECT x.pillar AS pillar_a, y.pillar AS pillar_b, x.score AS sa, y.score AS sb
    FROM per_user x
    JOIN per_user y ON y.user_id = x.user_id AND y.pillar > x.pillar
  )
  SELECT
    pillar_a, pillar_b,
    round(corr(sa, sb)::numeric, 3) AS correlation,
    count(*)::int AS sample_size
  FROM pairs
  GROUP BY pillar_a, pillar_b
  HAVING count(*) >= public.engagement_min_respondents()
  ORDER BY abs(corr(sa, sb)) DESC NULLS LAST;
$$;

REVOKE EXECUTE ON FUNCTION public.get_engagement_pillar_correlations(INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_engagement_pillar_correlations(INTEGER) TO authenticated, service_role;

-- ============ VISÃO GERAL ============
CREATE OR REPLACE FUNCTION public.get_engagement_overview(
  p_department_id UUID DEFAULT NULL,
  p_days INTEGER DEFAULT 90
)
RETURNS TABLE (
  overall_score NUMERIC,
  overall_favorability NUMERIC,
  respondents INTEGER,
  eligible_users INTEGER,
  participation_rate NUMERIC,
  answer_count INTEGER
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH scoped AS (
    SELECT
      a.user_id,
      CASE WHEN q.is_reverse THEN 10 - a.normalized_score ELSE a.normalized_score END AS score,
      q.weight
    FROM public.engagement_answers a
    JOIN public.engagement_question_pool q ON q.id = a.question_id
    WHERE a.normalized_score IS NOT NULL
      AND q.weight > 0
      AND a.answered_at >= now() - make_interval(days => GREATEST(p_days, 1))
      AND (p_department_id IS NULL OR a.department_id = p_department_id)
  ), eligible AS (
    SELECT count(*)::int AS total
    FROM public.profiles p
    WHERE p_department_id IS NULL
       OR EXISTS (
            SELECT 1 FROM public.team_members tm
            WHERE tm.user_id = p.id AND tm.department_id = p_department_id
          )
  ), agg AS (
    SELECT
      round(sum(score * weight) / NULLIF(sum(weight), 0), 2) AS overall_score,
      round(100.0 * count(*) FILTER (WHERE score >= 7) / NULLIF(count(*), 0), 1) AS overall_favorability,
      count(DISTINCT user_id)::int AS respondents,
      count(*)::int AS answer_count
    FROM scoped
  )
  SELECT
    agg.overall_score,
    agg.overall_favorability,
    agg.respondents,
    eligible.total,
    round(100.0 * agg.respondents / NULLIF(eligible.total, 0), 1),
    agg.answer_count
  FROM agg CROSS JOIN eligible
  WHERE agg.respondents >= public.engagement_min_respondents();
$$;

REVOKE EXECUTE ON FUNCTION public.get_engagement_overview(UUID, INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_engagement_overview(UUID, INTEGER) TO authenticated, service_role;