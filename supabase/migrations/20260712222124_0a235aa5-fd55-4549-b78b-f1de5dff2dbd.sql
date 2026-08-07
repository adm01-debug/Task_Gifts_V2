
-- Tabela postmortems
CREATE TABLE public.postmortems (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id uuid REFERENCES public.security_alerts(id) ON DELETE SET NULL,
  alert_type text,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','in_review','published')),
  severity text,
  incident_started_at timestamptz,
  incident_resolved_at timestamptz,
  duration_seconds integer,
  summary text,
  root_cause text,
  contributing_factors text,
  timeline text,
  action_items text,
  lessons_learned text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (alert_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.postmortems TO authenticated;
GRANT ALL ON public.postmortems TO service_role;

ALTER TABLE public.postmortems ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage postmortems"
ON public.postmortems FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_postmortems_updated_at
BEFORE UPDATE ON public.postmortems
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_postmortems_alert ON public.postmortems(alert_id);
CREATE INDEX idx_postmortems_status_created ON public.postmortems(status, created_at DESC);

-- Trigger: cria rascunho de postmortem ao resolver um sla_breach
CREATE OR REPLACE FUNCTION public.auto_create_postmortem_on_resolve()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_duration int;
  v_template text;
BEGIN
  IF NEW.alert_type <> 'sla_breach' THEN RETURN NEW; END IF;
  IF NOT (NEW.is_resolved = true AND (OLD.is_resolved IS DISTINCT FROM true)) THEN RETURN NEW; END IF;
  IF EXISTS (SELECT 1 FROM public.postmortems WHERE alert_id = NEW.id) THEN RETURN NEW; END IF;

  v_duration := CASE
    WHEN NEW.resolved_at IS NOT NULL
      THEN EXTRACT(EPOCH FROM (NEW.resolved_at - NEW.created_at))::int
    ELSE NULL
  END;

  v_template :=
    E'## Contexto\n\n- Tipo de alerta afetado: ' || COALESCE(NEW.metadata->>'target_alert_type', '—') ||
    E'\n- MTTA observado: ' || COALESCE(NEW.metadata->>'mtta_seconds', '—') || 's' ||
    E'\n- MTTR observado: ' || COALESCE(NEW.metadata->>'mttr_seconds', '—') || 's' ||
    E'\n- Meta MTTA: ' || COALESCE(NEW.metadata->>'mtta_target_seconds', '—') || 's' ||
    E'\n- Meta MTTR: ' || COALESCE(NEW.metadata->>'mttr_target_seconds', '—') || 's' ||
    E'\n\n## O que precisa ser preenchido\n\n1. Descreva o cenário em uma frase (o quê, quando, quem foi afetado).\n2. Confirme se o impacto foi apenas SLA ou também usuário final.';

  INSERT INTO public.postmortems (
    alert_id, alert_type, title, severity,
    incident_started_at, incident_resolved_at, duration_seconds,
    summary, root_cause, contributing_factors, timeline, action_items, lessons_learned,
    metadata
  ) VALUES (
    NEW.id, NEW.alert_type,
    'Postmortem — ' || NEW.title,
    NEW.severity,
    NEW.created_at, NEW.resolved_at, v_duration,
    v_template,
    '_Ainda por identificar._',
    '_Liste fatores que amplificaram o incidente._',
    E'| Horário | Evento |\n|---|---|\n| ' || to_char(NEW.created_at, 'DD/MM HH24:MI') || E' | Alerta criado |\n| ' ||
      COALESCE(to_char(NEW.acknowledged_at, 'DD/MM HH24:MI'), '—') || E' | Ack |\n| ' ||
      COALESCE(to_char(NEW.resolved_at, 'DD/MM HH24:MI'), '—') || E' | Resolvido |',
    E'- [ ] Ação 1 (owner, prazo)\n- [ ] Ação 2 (owner, prazo)',
    '_Preencha após a discussão do time._',
    jsonb_build_object('source', 'auto_on_resolve', 'alert_metadata', NEW.metadata)
  );

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.auto_create_postmortem_on_resolve() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_auto_create_postmortem ON public.security_alerts;
CREATE TRIGGER trg_auto_create_postmortem
AFTER UPDATE ON public.security_alerts
FOR EACH ROW EXECUTE FUNCTION public.auto_create_postmortem_on_resolve();
