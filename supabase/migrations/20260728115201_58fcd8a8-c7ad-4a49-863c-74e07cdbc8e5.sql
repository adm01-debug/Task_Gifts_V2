-- 1. Permitir alertas do domínio de previsões
ALTER TABLE public.security_alerts DROP CONSTRAINT IF EXISTS security_alerts_alert_type_check;
ALTER TABLE public.security_alerts ADD CONSTRAINT security_alerts_alert_type_check CHECK (
  alert_type = ANY (ARRAY['rate_limit_exceeded','brute_force','suspicious_login','ip_blocked','multiple_failed_2fa','unusual_location'])
  OR alert_type LIKE 'burn_rate_%'
  OR alert_type LIKE 'error_budget_%'
  OR alert_type LIKE 'sla_%'
  OR alert_type LIKE 'digest_%'
  OR alert_type LIKE 'lucky_wheel_%'
  OR alert_type LIKE 'prediction_%'
);

-- Idempotência: um alerta por mercado/tipo/hora (espelha o dedupeKey do motor TS)
CREATE UNIQUE INDEX IF NOT EXISTS security_alerts_prediction_dedupe_idx
  ON public.security_alerts (alert_type, (metadata->>'dedupe_key'))
  WHERE alert_type LIKE 'prediction_%';

-- 2. Registro automático da apuração na trilha auditável
CREATE OR REPLACE FUNCTION public.log_prediction_settlement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status IN ('settled','voided') AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.prediction_admin_events (market_id, action, actor_id, payload)
    VALUES (
      NEW.id,
      CASE WHEN NEW.status = 'voided' THEN 'voided' ELSE 'settled' END,
      NEW.settled_by,
      jsonb_build_object(
        'winning_option_id', NEW.winning_option_id,
        'total_pool', NEW.total_pool,
        'rake_collected', NEW.rake_collected
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_prediction_settlement ON public.prediction_markets;
CREATE TRIGGER trg_log_prediction_settlement
  AFTER UPDATE OF status ON public.prediction_markets
  FOR EACH ROW EXECUTE FUNCTION public.log_prediction_settlement();

-- 3. Vigilância: espelha src/lib/predictionWatchdog.ts
CREATE OR REPLACE FUNCTION public.check_prediction_markets_health()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_row record;
  v_created integer := 0;
  v_overdue_min integer;
  v_hours numeric;
  v_severity text;
  v_type text;
  v_bucket text;
BEGIN
  v_bucket := to_char(date_trunc('hour', now() AT TIME ZONE 'UTC'), 'YYYY-MM-DD"T"HH24:00:00');

  FOR v_row IN
    SELECT id, title, status, locks_at, total_pool
      FROM public.prediction_markets
     WHERE status IN ('open','locked')
  LOOP
    v_overdue_min := floor(EXTRACT(EPOCH FROM (now() - v_row.locks_at)) / 60)::integer;

    IF v_row.status = 'open' AND v_overdue_min >= 15 THEN
      v_type := 'prediction_lock_overdue';
    ELSIF v_row.status = 'locked' AND v_overdue_min >= 1440 THEN
      v_type := 'prediction_settlement_overdue';
    ELSE
      CONTINUE;
    END IF;

    v_hours := v_overdue_min / 60.0;
    IF COALESCE(v_row.total_pool, 0) <= 0 THEN
      v_severity := CASE WHEN v_hours >= 24 THEN 'medium' ELSE 'low' END;
    ELSIF v_hours >= 72 THEN v_severity := 'critical';
    ELSIF v_hours >= 24 THEN v_severity := 'high';
    ELSIF v_hours >= 4  THEN v_severity := 'medium';
    ELSE v_severity := 'low';
    END IF;

    INSERT INTO public.security_alerts (alert_type, severity, title, description, metadata)
    VALUES (
      v_type,
      v_severity,
      CASE WHEN v_type = 'prediction_lock_overdue'
           THEN 'Mercado de previsão vencido continua aberto'
           ELSE 'Mercado de previsão travado sem apuração' END,
      CASE WHEN v_type = 'prediction_lock_overdue'
           THEN format('"%s" deveria ter travado há %s minuto(s) e ainda aceita aportes. %s moeda(s) em risco.',
                       v_row.title, v_overdue_min, COALESCE(v_row.total_pool, 0))
           ELSE format('"%s" está travado há %s hora(s) sem resultado. %s moeda(s) seguem imobilizadas.',
                       v_row.title, floor(v_hours), COALESCE(v_row.total_pool, 0)) END,
      jsonb_build_object(
        'dedupe_key', v_type || ':' || v_row.id::text || ':' || v_bucket,
        'market_id', v_row.id,
        'overdue_minutes', v_overdue_min,
        'coins_at_risk', COALESCE(v_row.total_pool, 0)
      )
    )
    ON CONFLICT DO NOTHING;

    IF FOUND THEN
      v_created := v_created + 1;
    END IF;
  END LOOP;

  RETURN v_created;
END;
$$;

REVOKE ALL ON FUNCTION public.check_prediction_markets_health() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.log_prediction_settlement() FROM PUBLIC, anon, authenticated;

SELECT cron.schedule(
  'check-prediction-markets-health',
  '*/15 * * * *',
  $$SELECT public.check_prediction_markets_health();$$
);