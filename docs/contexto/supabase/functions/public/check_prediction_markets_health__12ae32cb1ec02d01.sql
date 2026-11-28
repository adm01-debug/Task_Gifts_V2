CREATE OR REPLACE FUNCTION public.check_prediction_markets_health()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_row record; v_created integer := 0; v_overdue_min integer; v_hours numeric; v_severity text; v_type text; v_bucket text;
BEGIN
  v_bucket := to_char(date_trunc('hour', now() AT TIME ZONE 'UTC'), 'YYYY-MM-DD"T"HH24:00:00');
  FOR v_row IN SELECT id, title, status, locks_at, total_pool FROM public.prediction_markets WHERE status IN ('open','locked') LOOP
    v_overdue_min := floor(EXTRACT(EPOCH FROM (now() - v_row.locks_at)) / 60)::integer;
    IF v_row.status = 'open' AND v_overdue_min >= 15 THEN v_type := 'prediction_lock_overdue';
    ELSIF v_row.status = 'locked' AND v_overdue_min >= 1440 THEN v_type := 'prediction_settlement_overdue';
    ELSE CONTINUE; END IF;
    v_hours := v_overdue_min / 60.0;
    IF COALESCE(v_row.total_pool, 0) <= 0 THEN v_severity := CASE WHEN v_hours >= 24 THEN 'medium' ELSE 'low' END;
    ELSIF v_hours >= 72 THEN v_severity := 'critical'; ELSIF v_hours >= 24 THEN v_severity := 'high'; ELSIF v_hours >= 4 THEN v_severity := 'medium'; ELSE v_severity := 'low'; END IF;
    INSERT INTO public.security_alerts (alert_type, severity, title, description, metadata) VALUES (v_type, v_severity, CASE WHEN v_type = 'prediction_lock_overdue' THEN 'Mercado de previsão vencido continua aberto' ELSE 'Mercado de previsão travado sem apuração' END, CASE WHEN v_type = 'prediction_lock_overdue' THEN format('"%s" deveria ter travado há %s minuto(s) e ainda aceita aportes. %s moeda(s) em risco.', v_row.title, v_overdue_min, COALESCE(v_row.total_pool, 0)) ELSE format('"%s" está travado há %s hora(s) sem resultado. %s moeda(s) seguem imobilizadas.', v_row.title, floor(v_hours), COALESCE(v_row.total_pool, 0)) END, jsonb_build_object('dedupe_key', v_type || ':' || v_row.id::text || ':' || v_bucket, 'market_id', v_row.id, 'overdue_minutes', v_overdue_min, 'coins_at_risk', COALESCE(v_row.total_pool, 0))) ON CONFLICT DO NOTHING;
    IF FOUND THEN v_created := v_created + 1; END IF;
  END LOOP; RETURN v_created;
END; $function$
