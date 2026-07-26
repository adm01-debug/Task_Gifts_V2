ALTER TABLE public.action_plans
  ADD COLUMN IF NOT EXISTS nr1_category_id uuid REFERENCES public.nr1_risk_categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_action_plans_nr1_category
  ON public.action_plans (nr1_category_id) WHERE nr1_category_id IS NOT NULL;

ALTER TABLE public.action_plans DROP CONSTRAINT IF EXISTS action_plans_source_check;
ALTER TABLE public.action_plans ADD CONSTRAINT action_plans_source_check
  CHECK (source = ANY (ARRAY['manual','engagement_factor','climate_survey','nine_box','nr1_category']));

CREATE OR REPLACE FUNCTION public.generate_action_plan_from_nr1_category(
  p_category_key text,
  p_department_id uuid DEFAULT NULL,
  p_days integer DEFAULT 90
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user uuid := auth.uid();
  v_days integer := GREATEST(COALESCE(p_days, 90), 1);
  v_category public.nr1_risk_categories%ROWTYPE;
  v_factor public.engagement_factors%ROWTYPE;
  v_factor_score numeric(5,2);
  v_category_score numeric(5,2);
  v_grade numeric(6,2);
  v_level text;
  v_deadline integer;
  v_existing uuid;
  v_plan_id uuid;
  v_cursor date := CURRENT_DATE;
  v_item record;
  v_idx integer := 0;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Autenticacao obrigatoria';
  END IF;

  IF NOT (public.has_role(v_user, 'admin'::app_role) OR public.has_role(v_user, 'manager'::app_role)) THEN
    RAISE EXCEPTION 'Apenas gestores e administradores podem gerar planos de acao';
  END IF;

  SELECT * INTO v_category
  FROM public.nr1_risk_categories
  WHERE key = p_category_key AND is_active;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Categoria de risco NR-1 nao encontrada: %', p_category_key;
  END IF;

  -- Idempotencia: reaproveita plano vivo da mesma categoria e area
  SELECT id INTO v_existing
  FROM public.action_plans
  WHERE nr1_category_id = v_category.id
    AND status IN ('planning','active','paused')
    AND department_id IS NOT DISTINCT FROM p_department_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_existing IS NOT NULL THEN
    RETURN v_existing;
  END IF;

  -- Score ponderado da categoria (mesma formula da matriz NR-1)
  SELECT round(sum(fs.score * m.weight) / NULLIF(sum(m.weight), 0), 2)
    INTO v_category_score
  FROM public.nr1_factor_mappings m
  JOIN public.get_engagement_factor_scores(p_department_id, v_days) fs ON fs.factor_id = m.factor_id
  WHERE m.category_id = v_category.id;

  -- Fator mais fragil da categoria (menor score; desempate por maior peso)
  SELECT f.* INTO v_factor
  FROM public.nr1_factor_mappings m
  JOIN public.engagement_factors f ON f.id = m.factor_id AND f.is_active
  LEFT JOIN public.get_engagement_factor_scores(p_department_id, v_days) fs ON fs.factor_id = m.factor_id
  WHERE m.category_id = v_category.id
  ORDER BY COALESCE(fs.score, 10) ASC, m.weight DESC, f.name ASC
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Nenhum fator de clima ativo mapeado para a categoria %', p_category_key;
  END IF;

  SELECT fs.score INTO v_factor_score
  FROM public.get_engagement_factor_scores(p_department_id, v_days) fs
  WHERE fs.factor_id = v_factor.id;

  v_grade := round((10 - COALESCE(v_category_score, 5)) * v_category.severity_weight, 2);
  v_level := CASE
    WHEN v_grade >= 15 THEN 'critical'
    WHEN v_grade >= 9 THEN 'high'
    WHEN v_grade >= 4.5 THEN 'moderate'
    ELSE 'low'
  END;
  v_deadline := CASE v_level WHEN 'critical' THEN 30 WHEN 'high' THEN 60 ELSE 90 END;

  INSERT INTO public.action_plans (
    title, description, pillar, engagement_factor_id, nr1_category_id, source, analysis_days,
    initial_score, target_score, current_score, root_cause_summary,
    target_date, department_id, owner_id, status
  ) VALUES (
    'NR-1: ' || v_category.name,
    'Plano de tratativa gerado a partir do inventario de riscos psicossociais (NR-1 / ISO 45003) para a categoria "' || v_category.name || '".',
    v_factor.pillar,
    v_factor.id,
    v_category.id,
    'nr1_category',
    v_days,
    v_category_score,
    LEAST(10::numeric, COALESCE(v_category_score, 5) + 1.5),
    v_category_score,
    COALESCE(v_category.description, v_category.name)
      || ' Grau de risco ' || v_grade::text || ' (' || v_level || ').'
      || ' Fator mais fragil: ' || v_factor.name
      || COALESCE(' (score ' || v_factor_score::text || ')', ' (sem score no periodo)') || '.'
      || COALESCE(' Base legal: ' || v_category.legal_reference || '.', ''),
    CURRENT_DATE + v_deadline,
    p_department_id,
    v_user,
    'planning'
  )
  RETURNING id INTO v_plan_id;

  FOR v_item IN
    SELECT * FROM public.engagement_action_playbooks
    WHERE pillar = v_factor.pillar AND is_active
    ORDER BY order_index
  LOOP
    v_idx := v_idx + 1;
    INSERT INTO public.action_plan_items (
      plan_id, what_title, what_description, why_reason,
      when_start, when_end, who_responsible_id, how_method,
      priority, order_index, status
    ) VALUES (
      v_plan_id, v_item.title, v_item.how_method, v_item.why_reason,
      v_cursor, LEAST(v_cursor + v_item.duration_days, CURRENT_DATE + v_deadline), v_user, v_item.how_method,
      v_item.priority, v_idx, 'pending'
    );
    v_cursor := v_cursor + GREATEST(v_item.duration_days / 2, 7);
  END LOOP;

  RETURN v_plan_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.generate_action_plan_from_nr1_category(text, uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.generate_action_plan_from_nr1_category(text, uuid, integer) TO authenticated;