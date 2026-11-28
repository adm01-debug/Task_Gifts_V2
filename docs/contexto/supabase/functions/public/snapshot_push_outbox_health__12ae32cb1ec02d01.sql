CREATE OR REPLACE FUNCTION public.snapshot_push_outbox_health()
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_since timestamptz := now() - interval '24 hours';
  v_stuck_cutoff timestamptz := now() - interval '5 minutes';
  v_pending integer; v_processing integer; v_stuck integer;
  v_sent integer; v_failed integer; v_skipped integer;
  v_oldest integer; v_idle integer;
  v_total integer; v_failure_rate numeric;
  v_penalty integer := 0;
  v_alerts jsonb := '[]'::jsonb;
  v_has_critical boolean := false;
  v_score integer;
  v_severity text;
  v_id uuid;
BEGIN
  SELECT
    COALESCE(SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN status = 'processing' AND updated_at < v_stuck_cutoff THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN status = 'sent' AND processed_at >= v_since THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN status = 'failed' AND processed_at >= v_since THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN status = 'skipped' AND processed_at >= v_since THEN 1 ELSE 0 END), 0),
    COALESCE(FLOOR(EXTRACT(EPOCH FROM (now() - MIN(CASE WHEN status = 'pending' THEN created_at END))) / 60), 0),
    CASE WHEN MAX(processed_at) IS NULL THEN NULL
         ELSE FLOOR(EXTRACT(EPOCH FROM (now() - MAX(processed_at))) / 60) END
  INTO v_pending, v_processing, v_stuck, v_sent, v_failed, v_skipped, v_oldest, v_idle
  FROM public.push_outbox;

  v_total := v_sent + v_failed + v_skipped;
  v_failure_rate := CASE WHEN v_total = 0 THEN 0 ELSE v_failed::numeric / v_total END;

  IF v_pending >= 500 THEN
    v_penalty := v_penalty + 40; v_has_critical := true;
    v_alerts := v_alerts || jsonb_build_object('code','backlog','severity','critical','message', format('Backlog crítico: %s pendentes.', v_pending));
  ELSIF v_pending >= 100 THEN
    v_penalty := v_penalty + 15;
    v_alerts := v_alerts || jsonb_build_object('code','backlog','severity','warning','message', format('Backlog elevado: %s pendentes.', v_pending));
  END IF;

  IF v_oldest >= 30 THEN
    v_penalty := v_penalty + 30; v_has_critical := true;
    v_alerts := v_alerts || jsonb_build_object('code','aging_queue','severity','critical','message', format('Item mais antigo há %s min.', v_oldest));
  ELSIF v_oldest >= 10 THEN
    v_penalty := v_penalty + 10;
    v_alerts := v_alerts || jsonb_build_object('code','aging_queue','severity','warning','message', format('Item mais antigo há %s min.', v_oldest));
  END IF;

  IF v_stuck >= 25 THEN
    v_penalty := v_penalty + 30; v_has_critical := true;
    v_alerts := v_alerts || jsonb_build_object('code','stuck_items','severity','critical','message', format('%s itens presos em processamento.', v_stuck));
  ELSIF v_stuck > 0 THEN
    v_penalty := v_penalty + 12;
    v_alerts := v_alerts || jsonb_build_object('code','stuck_items','severity','warning','message', format('%s itens presos em processamento.', v_stuck));
  END IF;

  IF v_total > 0 THEN
    IF v_failure_rate >= 0.25 THEN
      v_penalty := v_penalty + 35; v_has_critical := true;
      v_alerts := v_alerts || jsonb_build_object('code','failure_rate','severity','critical','message', format('Taxa de falha em %s%%.', round(v_failure_rate * 100, 1)));
    ELSIF v_failure_rate >= 0.10 THEN
      v_penalty := v_penalty + 12;
      v_alerts := v_alerts || jsonb_build_object('code','failure_rate','severity','warning','message', format('Taxa de falha em %s%%.', round(v_failure_rate * 100, 1)));
    END IF;
  END IF;

  IF v_pending + v_processing > 0 THEN
    IF v_idle IS NULL OR v_idle >= 15 THEN
      v_penalty := v_penalty + 35; v_has_critical := true;
      v_alerts := v_alerts || jsonb_build_object('code','stale_dispatcher','severity','critical','message','Despachante sem execuções recentes com fila acumulada.');
    ELSIF v_idle >= 5 THEN
      v_penalty := v_penalty + 12;
      v_alerts := v_alerts || jsonb_build_object('code','stale_dispatcher','severity','warning','message', format('Último despacho há %s min.', v_idle));
    END IF;
  END IF;

  v_score := GREATEST(0, LEAST(100, 100 - v_penalty));
  IF v_has_critical THEN v_score := LEAST(v_score, 60); END IF;
  v_severity := CASE WHEN v_has_critical THEN 'critical'
                     WHEN jsonb_array_length(v_alerts) > 0 THEN 'warning'
                     ELSE 'ok' END;

  INSERT INTO public.push_outbox_health_snapshots
    (score, severity, pending, processing, stuck, sent, failed, skipped, oldest_pending_minutes, minutes_since_last_dispatch, alerts)
  VALUES
    (v_score, v_severity, v_pending, v_processing, v_stuck, v_sent, v_failed, v_skipped, v_oldest, v_idle, v_alerts)
  RETURNING id INTO v_id;

  -- Alerta de segurança com deduplicação horária (evita flood do pg_cron)
  IF v_score < 60 AND NOT EXISTS (
    SELECT 1 FROM public.security_alerts
    WHERE alert_type = 'push_queue_degraded'
      AND is_resolved = false
      AND created_at > now() - interval '1 hour'
  ) THEN
    INSERT INTO public.security_alerts (alert_type, severity, title, description, metadata)
    VALUES (
      'push_queue_degraded',
      CASE WHEN v_severity = 'critical' THEN 'high' ELSE 'medium' END,
      'Fila de notificações push degradada',
      format('Score %s/100 — %s pendentes, %s presos, %s falhas em 24h.', v_score, v_pending, v_stuck, v_failed),
      jsonb_build_object('snapshot_id', v_id, 'score', v_score, 'alerts', v_alerts)
    );
  END IF;

  -- Retenção: 30 dias de série histórica
  DELETE FROM public.push_outbox_health_snapshots WHERE created_at < now() - interval '30 days';

  RETURN v_id;
END;
$function$
