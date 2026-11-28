CREATE OR REPLACE FUNCTION public.check_overdue_postmortem_actions()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_overdue jsonb;
  v_count int;
  v_alert_id uuid;
BEGIN
  IF current_setting('request.jwt.claim.role', true) <> 'service_role'
     AND (auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::app_role)) THEN
    RAISE EXCEPTION 'insufficient_privilege' USING ERRCODE = '42501';
  END IF;

  SELECT jsonb_agg(row_to_json(t)), COUNT(*)
    INTO v_overdue, v_count
  FROM (
    SELECT
      a.id, a.title, a.priority, a.status,
      a.due_date, a.owner_label,
      p.id AS postmortem_id, p.title AS postmortem_title,
      (CURRENT_DATE - a.due_date) AS days_overdue
    FROM public.postmortem_actions a
    JOIN public.postmortems p ON p.id = a.postmortem_id
    WHERE a.status IN ('open','in_progress')
      AND a.due_date IS NOT NULL
      AND a.due_date < CURRENT_DATE
    ORDER BY a.due_date ASC
    LIMIT 100
  ) t;

  IF v_count = 0 THEN
    RETURN jsonb_build_object('overdue_count', 0, 'executed_at', now());
  END IF;

  -- Deduplicação: um alerta por dia
  IF EXISTS (
    SELECT 1 FROM public.security_alerts
    WHERE alert_type = 'postmortem_actions_overdue'
      AND created_at::date = CURRENT_DATE
  ) THEN
    RETURN jsonb_build_object('overdue_count', v_count, 'alert_created', false, 'reason', 'already_alerted_today');
  END IF;

  INSERT INTO public.security_alerts (alert_type, severity, title, description, metadata)
  VALUES (
    'postmortem_actions_overdue',
    CASE WHEN v_count >= 10 THEN 'high' WHEN v_count >= 3 THEN 'medium' ELSE 'low' END,
    format('%s item(ns) de ação de postmortem em atraso', v_count),
    format('Existem %s ações atrasadas de postmortems (aberto/em progresso).', v_count),
    jsonb_build_object(
      'overdue_count', v_count,
      'items', v_overdue,
      'deep_link', '/admin/postmortems',
      'checked_at', now()
    )
  )
  RETURNING id INTO v_alert_id;

  RETURN jsonb_build_object('overdue_count', v_count, 'alert_created', true, 'alert_id', v_alert_id);
END;
$function$
