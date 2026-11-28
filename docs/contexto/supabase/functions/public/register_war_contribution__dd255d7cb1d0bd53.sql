CREATE OR REPLACE FUNCTION public.register_war_contribution(p_war_id uuid, p_metric_key text, p_amount numeric, p_dedupe_key text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_user uuid := auth.uid(); v_war public.department_wars%ROWTYPE; v_dept uuid; v_inserted uuid;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'unauthenticated'); END IF;
  IF p_amount IS NULL OR p_amount <= 0 OR p_amount > 1000000 THEN RETURN jsonb_build_object('success', false, 'reason', 'invalid_amount'); END IF;
  IF p_metric_key IS NULL OR length(trim(p_metric_key)) = 0 THEN RETURN jsonb_build_object('success', false, 'reason', 'invalid_metric'); END IF;
  IF p_dedupe_key IS NULL OR length(trim(p_dedupe_key)) = 0 THEN RETURN jsonb_build_object('success', false, 'reason', 'invalid_dedupe_key'); END IF;
  SELECT * INTO v_war FROM public.department_wars WHERE id = p_war_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'reason', 'not_found'); END IF;
  IF v_war.status <> 'running' THEN RETURN jsonb_build_object('success', false, 'reason', 'not_running'); END IF;
  IF now() < v_war.starts_at OR now() > v_war.ends_at THEN RETURN jsonb_build_object('success', false, 'reason', 'outside_window'); END IF;
  IF NOT EXISTS (SELECT 1 FROM public.department_war_metrics WHERE war_id = p_war_id AND metric_key = p_metric_key) THEN RETURN jsonb_build_object('success', false, 'reason', 'metric_not_scored'); END IF;
  v_dept := public.get_user_department_id(v_user);
  IF v_dept IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'no_department'); END IF;
  IF NOT EXISTS (SELECT 1 FROM public.department_war_departments WHERE war_id = p_war_id AND department_id = v_dept) THEN RETURN jsonb_build_object('success', false, 'reason', 'department_not_enrolled'); END IF;
  INSERT INTO public.department_war_contributions (war_id, department_id, user_id, metric_key, amount, dedupe_key) VALUES (p_war_id, v_dept, v_user, p_metric_key, p_amount, v_user::text || ':' || p_dedupe_key) ON CONFLICT (war_id, dedupe_key) DO NOTHING RETURNING id INTO v_inserted;
  IF v_inserted IS NULL THEN RETURN jsonb_build_object('success', true, 'duplicate', true); END IF;
  RETURN jsonb_build_object('success', true, 'duplicate', false, 'department_id', v_dept, 'contribution_id', v_inserted);
END;
$function$
