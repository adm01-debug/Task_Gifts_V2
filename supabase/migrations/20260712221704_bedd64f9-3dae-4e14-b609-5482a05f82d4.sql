CREATE TABLE IF NOT EXISTS public.sla_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type text NOT NULL UNIQUE,
  mtta_target_seconds integer NOT NULL CHECK (mtta_target_seconds > 0),
  mttr_target_seconds integer NOT NULL CHECK (mttr_target_seconds > 0),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sla_targets TO authenticated;
GRANT ALL ON public.sla_targets TO service_role;

ALTER TABLE public.sla_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage SLA targets" ON public.sla_targets
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_sla_targets_updated
BEFORE UPDATE ON public.sla_targets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed sensible defaults (idempotent)
INSERT INTO public.sla_targets(alert_type, mtta_target_seconds, mttr_target_seconds, notes) VALUES
  ('burn_rate_fast', 300, 1800, 'Burn rate rápido (SEV1) — ACK ≤5min, MTTR ≤30min'),
  ('burn_rate_slow', 900, 7200, 'Burn rate lento (SEV2) — ACK ≤15min, MTTR ≤2h'),
  ('error_budget_critical', 600, 3600, 'Orçamento de erro crítico — ACK ≤10min, MTTR ≤1h'),
  ('error_budget_high', 1800, 14400, 'Orçamento de erro alto — ACK ≤30min, MTTR ≤4h'),
  ('sla_watchdog', 900, 7200, 'Watchdog de SLA — ACK ≤15min, MTTR ≤2h'),
  ('digest_weekly', 86400, 172800, 'Digest semanal — ACK em até 24h, ação até 48h'),
  ('brute_force', 300, 1800, 'Ataque brute-force — ACK ≤5min, MTTR ≤30min'),
  ('rate_limit_exceeded', 1800, 14400, 'Rate limit exceeded — ACK ≤30min, MTTR ≤4h')
ON CONFLICT (alert_type) DO NOTHING;

-- Recreate metrics function to join targets and expose breach flags
DROP FUNCTION IF EXISTS public.get_incident_metrics(integer);

CREATE OR REPLACE FUNCTION public.get_incident_metrics(p_days integer DEFAULT 30)
RETURNS TABLE (
  week_start date,
  alert_type text,
  incidents bigint,
  acknowledged bigint,
  resolved bigint,
  mtta_seconds numeric,
  mttr_seconds numeric,
  p95_mttr_seconds numeric,
  mtta_target_seconds integer,
  mttr_target_seconds integer,
  mtta_breached boolean,
  mttr_breached boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  RETURN QUERY
  WITH agg AS (
    SELECT
      date_trunc('week', a.created_at)::date AS week_start,
      a.alert_type,
      count(*)::bigint AS incidents,
      count(a.acknowledged_at)::bigint AS acknowledged,
      count(a.resolved_at)::bigint AS resolved,
      avg(EXTRACT(EPOCH FROM (a.acknowledged_at - a.created_at)))::numeric AS mtta_seconds,
      avg(EXTRACT(EPOCH FROM (a.resolved_at - a.created_at)))::numeric AS mttr_seconds,
      percentile_cont(0.95) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (a.resolved_at - a.created_at)))::numeric AS p95_mttr_seconds
    FROM public.security_alerts a
    WHERE a.created_at >= now() - (p_days || ' days')::interval
    GROUP BY 1, 2
  )
  SELECT
    agg.week_start,
    agg.alert_type,
    agg.incidents,
    agg.acknowledged,
    agg.resolved,
    agg.mtta_seconds,
    agg.mttr_seconds,
    agg.p95_mttr_seconds,
    t.mtta_target_seconds,
    t.mttr_target_seconds,
    (t.mtta_target_seconds IS NOT NULL AND agg.mtta_seconds IS NOT NULL AND agg.mtta_seconds > t.mtta_target_seconds) AS mtta_breached,
    (t.mttr_target_seconds IS NOT NULL AND agg.mttr_seconds IS NOT NULL AND agg.mttr_seconds > t.mttr_target_seconds) AS mttr_breached
  FROM agg
  LEFT JOIN public.sla_targets t ON t.alert_type = agg.alert_type
  ORDER BY agg.week_start DESC, agg.incidents DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.get_incident_metrics(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_incident_metrics(integer) TO authenticated;