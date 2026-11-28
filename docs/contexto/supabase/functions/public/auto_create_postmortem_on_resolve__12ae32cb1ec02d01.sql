CREATE OR REPLACE FUNCTION public.auto_create_postmortem_on_resolve()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
