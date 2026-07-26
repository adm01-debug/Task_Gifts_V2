CREATE TABLE public.nr1_risk_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  legal_reference text,
  severity_weight numeric NOT NULL DEFAULT 1 CHECK (severity_weight >= 1 AND severity_weight <= 3),
  order_index integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.nr1_risk_categories TO authenticated;
GRANT ALL ON public.nr1_risk_categories TO service_role;
ALTER TABLE public.nr1_risk_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "nr1_categories_select" ON public.nr1_risk_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "nr1_categories_admin_write" ON public.nr1_risk_categories FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER trg_nr1_categories_updated BEFORE UPDATE ON public.nr1_risk_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.nr1_factor_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.nr1_risk_categories(id) ON DELETE CASCADE,
  factor_id uuid NOT NULL REFERENCES public.engagement_factors(id) ON DELETE CASCADE,
  weight numeric NOT NULL DEFAULT 1 CHECK (weight > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (category_id, factor_id)
);

CREATE INDEX idx_nr1_map_category ON public.nr1_factor_mappings(category_id);
CREATE INDEX idx_nr1_map_factor ON public.nr1_factor_mappings(factor_id);
GRANT SELECT ON public.nr1_factor_mappings TO authenticated;
GRANT ALL ON public.nr1_factor_mappings TO service_role;
ALTER TABLE public.nr1_factor_mappings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "nr1_mappings_select" ON public.nr1_factor_mappings FOR SELECT TO authenticated USING (true);
CREATE POLICY "nr1_mappings_admin_write" ON public.nr1_factor_mappings FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.nr1_risk_categories (key, name, description, legal_reference, severity_weight, order_index) VALUES
('workload', 'Sobrecarga e ritmo de trabalho', 'Volume, prazos e jornada que excedem a capacidade de recuperação do trabalhador.', 'NR-1 item 1.5.3.2 / ISO 45003 4.3.1', 3, 1),
('autonomy_control', 'Baixa autonomia e controle', 'Pouca influência sobre o próprio trabalho, métodos e ritmo.', 'ISO 45003 4.3.2', 2.5, 2),
('relationships', 'Relações interpessoais, assédio e violência', 'Conflitos, incivilidade, assédio moral ou sexual no ambiente de trabalho.', 'NR-1 item 1.5.3.2 / CLT art. 223-A', 3, 3),
('leadership_support', 'Liderança e suporte insuficientes', 'Falta de apoio, feedback e clareza por parte da gestão direta.', 'ISO 45003 4.3.3', 2.5, 4),
('recognition_reward', 'Reconhecimento e recompensa inadequados', 'Desequilíbrio entre esforço despendido e retorno percebido.', 'Modelo Esforço-Recompensa (Siegrist)', 2, 5),
('communication_clarity', 'Comunicação e clareza de papéis', 'Informação insuficiente, ambiguidade e conflito de papéis.', 'ISO 45003 4.3.4', 2, 6),
('career_insecurity', 'Insegurança e estagnação na carreira', 'Percepção de instabilidade e ausência de perspectivas de desenvolvimento.', 'ISO 45003 4.3.5', 2, 7),
('work_environment', 'Ambiente e condições de trabalho', 'Condições físicas, ergonômicas e recursos que impactam a saúde mental.', 'NR-1 item 1.5.3.2', 2, 8);

INSERT INTO public.nr1_factor_mappings (category_id, factor_id, weight)
SELECT c.id, f.id, 1
FROM public.nr1_risk_categories c
JOIN public.engagement_factors f ON f.pillar = (CASE c.key
  WHEN 'workload' THEN 'balance'
  WHEN 'autonomy_control' THEN 'autonomy'
  WHEN 'relationships' THEN 'peers'
  WHEN 'leadership_support' THEN 'leadership'
  WHEN 'recognition_reward' THEN 'recognition'
  WHEN 'communication_clarity' THEN 'communication'
  WHEN 'career_insecurity' THEN 'growth'
  WHEN 'work_environment' THEN 'environment'
END)::climate_pillar
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.get_nr1_risk_matrix(p_department_id uuid DEFAULT NULL, p_days integer DEFAULT 90)
RETURNS TABLE(
  category_id uuid, category_key text, category_name text, description text,
  legal_reference text, severity_weight numeric, score numeric, probability numeric,
  risk_grade numeric, risk_level text, respondents integer, factors_evaluated integer
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
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
$$;

REVOKE EXECUTE ON FUNCTION public.get_nr1_risk_matrix(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_nr1_risk_matrix(uuid, integer) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_nr1_summary(p_department_id uuid DEFAULT NULL, p_days integer DEFAULT 90)
RETURNS TABLE(
  categories_evaluated integer, critical_count integer, high_count integer,
  moderate_count integer, low_count integer, avg_risk_grade numeric, max_risk_grade numeric
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  WITH m AS (SELECT * FROM public.get_nr1_risk_matrix(p_department_id, p_days))
  SELECT
    count(*)::int,
    count(*) FILTER (WHERE risk_level = 'critical')::int,
    count(*) FILTER (WHERE risk_level = 'high')::int,
    count(*) FILTER (WHERE risk_level = 'moderate')::int,
    count(*) FILTER (WHERE risk_level = 'low')::int,
    round(avg(risk_grade), 2),
    round(max(risk_grade), 2)
  FROM m;
$$;

REVOKE EXECUTE ON FUNCTION public.get_nr1_summary(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_nr1_summary(uuid, integer) TO authenticated, service_role;