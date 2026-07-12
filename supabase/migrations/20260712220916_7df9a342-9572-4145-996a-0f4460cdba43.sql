
-- Ack columns on security_alerts
ALTER TABLE public.security_alerts
  ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS acknowledged_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS acknowledgment_notes TEXT,
  ADD COLUMN IF NOT EXISTS runbook_slug TEXT;

CREATE INDEX IF NOT EXISTS idx_security_alerts_ack ON public.security_alerts(acknowledged_at) WHERE acknowledged_at IS NULL;

-- Runbook execution audit
CREATE TABLE IF NOT EXISTS public.runbook_executions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_id UUID REFERENCES public.security_alerts(id) ON DELETE CASCADE,
  runbook_slug TEXT NOT NULL,
  phase TEXT NOT NULL CHECK (phase IN ('diagnose','mitigate','recover','postmortem','note')),
  step_index INTEGER,
  step_title TEXT,
  notes TEXT,
  performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.runbook_executions TO authenticated;
GRANT ALL ON public.runbook_executions TO service_role;

ALTER TABLE public.runbook_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage runbook executions"
  ON public.runbook_executions
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_runbook_exec_alert ON public.runbook_executions(alert_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_runbook_exec_slug ON public.runbook_executions(runbook_slug, created_at DESC);

-- Ack RPC (SECURITY DEFINER to enforce admin + set fields atomically)
CREATE OR REPLACE FUNCTION public.acknowledge_security_alert(
  _alert_id UUID,
  _runbook_slug TEXT,
  _notes TEXT
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

REVOKE ALL ON FUNCTION public.acknowledge_security_alert(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.acknowledge_security_alert(UUID, TEXT, TEXT) TO authenticated;
