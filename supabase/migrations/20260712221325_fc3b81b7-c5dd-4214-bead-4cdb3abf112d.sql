CREATE OR REPLACE FUNCTION public.log_runbook_step(
  p_alert_id uuid,
  p_runbook_slug text,
  p_phase text,
  p_step_index integer,
  p_step_title text,
  p_notes text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  INSERT INTO public.runbook_executions(alert_id, runbook_slug, phase, step_index, step_title, notes, performed_by)
  VALUES (p_alert_id, p_runbook_slug, p_phase, p_step_index, p_step_title, p_notes, auth.uid())
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.log_runbook_step(uuid, text, text, integer, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_runbook_step(uuid, text, text, integer, text, text) TO authenticated;