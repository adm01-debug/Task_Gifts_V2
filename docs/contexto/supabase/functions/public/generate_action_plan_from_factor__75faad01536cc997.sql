CREATE OR REPLACE FUNCTION public.generate_action_plan_from_factor(p_factor_key text, p_department_id uuid DEFAULT NULL::uuid, p_days integer DEFAULT 90)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_user uuid := auth.uid(); v_days integer := GREATEST(COALESCE(p_days, 90), 1); v_factor public.engagement_factors%ROWTYPE; v_score numeric(5,2); v_existing uuid; v_plan_id uuid; v_cursor date := CURRENT_DATE; v_item record; v_idx integer := 0;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Autenticacao obrigatoria'; END IF;
  IF NOT (public.has_role(v_user, 'admin'::app_role) OR public.has_role(v_user, 'manager'::app_role)) THEN RAISE EXCEPTION 'Apenas gestores e administradores podem gerar planos de acao'; END IF;
  SELECT * INTO v_factor FROM public.engagement_factors WHERE key = p_factor_key AND is_active;
  IF NOT FOUND THEN RAISE EXCEPTION 'Fator de engajamento nao encontrado: %', p_factor_key; END IF;
  SELECT id INTO v_existing FROM public.action_plans WHERE engagement_factor_id = v_factor.id AND status IN ('planning', 'active', 'paused') AND department_id IS NOT DISTINCT FROM p_department_id ORDER BY created_at DESC LIMIT 1;
  IF v_existing IS NOT NULL THEN RETURN v_existing; END IF;
  SELECT f.score INTO v_score FROM public.get_engagement_factor_scores(p_department_id, v_days) f WHERE f.factor_key = p_factor_key;
  INSERT INTO public.action_plans (title, description, pillar, engagement_factor_id, source, analysis_days, initial_score, target_score, current_score, root_cause_summary, target_date, department_id, owner_id, status) VALUES ('Plano de acao: ' || v_factor.name, 'Plano gerado automaticamente a partir do diagnostico de engajamento do fator "' || v_factor.name || '".', v_factor.pillar, v_factor.id, 'engagement_factor', v_days, v_score, LEAST(10::numeric, COALESCE(v_score, 5) + 1.5), v_score, COALESCE(v_factor.description, v_factor.name) || CASE WHEN v_score IS NULL THEN ' (sem score suficiente no periodo analisado).' ELSE ' (score atual: ' || v_score::text || ').' END, CURRENT_DATE + 90, p_department_id, v_user, 'planning') RETURNING id INTO v_plan_id;
  FOR v_item IN SELECT * FROM public.engagement_action_playbooks WHERE pillar = v_factor.pillar AND is_active ORDER BY order_index LOOP v_idx := v_idx + 1; INSERT INTO public.action_plan_items (plan_id, what_title, what_description, why_reason, when_start, when_end, who_responsible_id, how_method, priority, order_index, status) VALUES (v_plan_id, v_item.title, v_item.how_method, v_item.why_reason, v_cursor, v_cursor + v_item.duration_days, v_user, v_item.how_method, v_item.priority, v_idx, 'pending'); v_cursor := v_cursor + GREATEST(v_item.duration_days / 2, 7); END LOOP;
  RETURN v_plan_id;
END; $function$
