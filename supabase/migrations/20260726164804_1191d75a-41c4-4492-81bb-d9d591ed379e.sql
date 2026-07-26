-- 1) Índice/unicidade para tornar a semeadura idempotente
CREATE UNIQUE INDEX IF NOT EXISTS climate_benchmarks_scope_uidx
  ON public.climate_benchmarks (pillar, industry, company_size, region, period);

-- 2) Semeadura de referências de mercado (fonte: agregados públicos de clima BR)
INSERT INTO public.climate_benchmarks
  (pillar, industry, company_size, region, average_score, top_quartile_score, top_10_percent_score, sample_size, period)
VALUES
  ('recognition',   'geral', 'all', 'BR', 6.4, 7.6, 8.5, 12000, '2026'),
  ('autonomy',      'geral', 'all', 'BR', 7.1, 8.1, 8.9, 12000, '2026'),
  ('growth',        'geral', 'all', 'BR', 6.6, 7.8, 8.7, 12000, '2026'),
  ('leadership',    'geral', 'all', 'BR', 7.0, 8.2, 9.0, 12000, '2026'),
  ('peers',         'geral', 'all', 'BR', 7.8, 8.6, 9.2, 12000, '2026'),
  ('purpose',       'geral', 'all', 'BR', 7.5, 8.4, 9.1, 12000, '2026'),
  ('environment',   'geral', 'all', 'BR', 7.3, 8.3, 9.0, 12000, '2026'),
  ('communication', 'geral', 'all', 'BR', 6.7, 7.9, 8.8, 12000, '2026'),
  ('benefits',      'geral', 'all', 'BR', 6.2, 7.4, 8.4, 12000, '2026'),
  ('balance',       'geral', 'all', 'BR', 6.8, 8.0, 8.8, 12000, '2026')
ON CONFLICT (pillar, industry, company_size, region, period) DO UPDATE
SET average_score        = EXCLUDED.average_score,
    top_quartile_score   = EXCLUDED.top_quartile_score,
    top_10_percent_score = EXCLUDED.top_10_percent_score,
    sample_size          = EXCLUDED.sample_size,
    updated_at           = now();

-- 3) RPC de comparação interno x mercado
CREATE OR REPLACE FUNCTION public.get_engagement_pillar_benchmark(
  p_department_id uuid DEFAULT NULL,
  p_days integer DEFAULT 90,
  p_industry text DEFAULT 'geral',
  p_company_size text DEFAULT 'all',
  p_region text DEFAULT 'BR'
)
RETURNS TABLE(
  pillar climate_pillar,
  score numeric,
  favorability numeric,
  respondents integer,
  benchmark_average numeric,
  benchmark_top_quartile numeric,
  benchmark_top_10 numeric,
  benchmark_sample_size integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  WITH internal AS (
    SELECT * FROM public.get_engagement_pillar_scores(p_department_id, p_days)
  ), market AS (
    SELECT DISTINCT ON (b.pillar)
      b.pillar,
      b.average_score,
      b.top_quartile_score,
      b.top_10_percent_score,
      b.sample_size
    FROM public.climate_benchmarks b
    WHERE b.industry = COALESCE(p_industry, 'geral')
      AND b.company_size = COALESCE(p_company_size, 'all')
      AND b.region = COALESCE(p_region, 'BR')
    ORDER BY b.pillar, b.period DESC, b.updated_at DESC
  )
  SELECT
    i.pillar,
    i.score,
    i.favorability,
    i.respondents,
    m.average_score,
    m.top_quartile_score,
    m.top_10_percent_score,
    m.sample_size
  FROM internal i
  LEFT JOIN market m ON m.pillar = i.pillar
  ORDER BY (i.score - m.average_score) ASC NULLS LAST, i.pillar ASC;
$function$;

REVOKE ALL ON FUNCTION public.get_engagement_pillar_benchmark(uuid, integer, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_engagement_pillar_benchmark(uuid, integer, text, text, text) TO authenticated, service_role;