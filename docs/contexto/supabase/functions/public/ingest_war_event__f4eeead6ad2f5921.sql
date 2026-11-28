CREATE OR REPLACE FUNCTION public.ingest_war_event(p_user_id uuid, p_metric_key text, p_amount numeric, p_dedupe_key text)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_dept uuid; v_amount numeric; v_key text; v_count integer := 0; v_war record;
BEGIN
  IF p_user_id IS NULL THEN RETURN 0; END IF;
  v_amount := floor(COALESCE(p_amount, 0));
  IF v_amount IS NULL OR v_amount <= 0 THEN RETURN 0; END IF;
  IF v_amount > 1000000 THEN v_amount := 1000000; END IF;
  IF p_metric_key IS NULL OR length(trim(p_metric_key)) = 0 THEN RETURN 0; END IF;
  IF p_dedupe_key IS NULL OR length(trim(p_dedupe_key)) = 0 THEN RETURN 0; END IF;
  v_key := p_user_id::text || ':' || left(trim(p_dedupe_key), 180);
  v_dept := public.get_user_department_id(p_user_id);
  IF v_dept IS NULL THEN RETURN 0; END IF;
  FOR v_war IN SELECT w.id FROM public.department_wars w JOIN public.department_war_departments d ON d.war_id = w.id AND d.department_id = v_dept WHERE w.status = 'running' AND now() >= w.starts_at AND now() <= w.ends_at AND EXISTS (SELECT 1 FROM public.department_war_metrics m WHERE m.war_id = w.id AND m.metric_key = trim(p_metric_key)) LOOP
    INSERT INTO public.department_war_contributions (war_id, department_id, user_id, metric_key, amount, dedupe_key) VALUES (v_war.id, v_dept, p_user_id, trim(p_metric_key), v_amount, v_key) ON CONFLICT (war_id, dedupe_key) DO NOTHING;
    IF FOUND THEN v_count := v_count + 1; END IF;
  END LOOP;
  RETURN v_count;
END;
$function$
