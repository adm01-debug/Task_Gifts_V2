CREATE OR REPLACE FUNCTION public.acknowledge_security_alert(_alert_id uuid, _runbook_slug text, _notes text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  UPDATE public.security_alerts
     SET acknowledged_at = COALESCE(acknowledged_at, now()),
         acknowledged_by = COALESCE(acknowledged_by, auth.uid()),
         acknowledgment_notes = _notes,
         runbook_slug = COALESCE(runbook_slug, _runbook_slug)
   WHERE id = _alert_id;

  INSERT INTO public.runbook_executions (alert_id, runbook_slug, phase, notes, performed_by)
  VALUES (_alert_id, _runbook_slug, 'note', _notes, auth.uid());
END;
$function$
