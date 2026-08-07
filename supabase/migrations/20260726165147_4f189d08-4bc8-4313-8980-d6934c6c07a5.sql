DROP FUNCTION IF EXISTS public.get_engagement_pillar_benchmark(uuid, integer, text, text, text);

CREATE FUNCTION public.get_engagement_pillar_benchmark(
  p_department_id uuid DEFAULT NULL::uuid,
  p_days integer DEFAULT 90,
  p_industry text DEFAULT 'geral'::text,
  p_company_size text DEFAULT 'all'::text,
  p_region text DEFAULT 'BR'::text
)
RETURNS TABLE(
  pillar climate_pillar,
  score numeric,
  favorability numeric,
  respondents integer,
  benchmark_average numeric,
  benchmark_top_quartile numeric,
  benchmark_top_10 numeric,
  benchmark_sample_size integer,
  benchmark_industry text,
  benchmark_company_size text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  WITH params AS (
    SELECT
      COALESCE(NULLIF(btrim(lower(p_industry)), ''), 'geral') AS industry,
      COALESCE(NULLIF(btrim(lower(p_company_size)), ''), 'all') AS company_size,
      COALESCE(NULLIF(btrim(upper(p_region)), ''), 'BR') AS region
  ), internal AS (
    SELECT * FROM public.get_engagement_pillar_scores(p_department_id, p_days)
  ), candidates AS (
    SELECT
      b.*,
      CASE
        WHEN b.industry = p.industry AND b.company_size = p.company_size THEN 1
        WHEN b.industry = p.industry AND b.company_size = 'all' THEN 2
        WHEN b.industry = 'geral' AND b.company_size = p.company_size THEN 3
        WHEN b.industry = 'geral' AND b.company_size = 'all' THEN 4
        ELSE NULL
      END AS priority
    FROM public.climate_benchmarks b
    CROSS JOIN params p
    WHERE b.region = p.region
  ), market AS (
    SELECT DISTINCT ON (c.pillar)
      c.pillar,
      c.average_score,
      c.top_quartile_score,
      c.top_10_percent_score,
      c.sample_size,
      c.industry,
      c.company_size
    FROM candidates c
    WHERE c.priority IS NOT NULL
    ORDER BY c.pillar, c.priority ASC, c.period DESC, c.updated_at DESC
  )
  SELECT
    i.pillar,
    i.score,
    i.favorability,
    i.respondents,
    m.average_score,
    m.top_quartile_score,
    m.top_10_percent_score,
    m.sample_size,
    m.industry,
    m.company_size
  FROM internal i
  LEFT JOIN market m ON m.pillar = i.pillar
  ORDER BY (i.score - m.average_score) ASC NULLS LAST, i.pillar ASC;
$function$;

REVOKE ALL ON FUNCTION public.get_engagement_pillar_benchmark(uuid, integer, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_engagement_pillar_benchmark(uuid, integer, text, text, text) TO authenticated, service_role;

CREATE INDEX IF NOT EXISTS idx_climate_benchmarks_segment
  ON public.climate_benchmarks (region, industry, company_size, pillar, period DESC);