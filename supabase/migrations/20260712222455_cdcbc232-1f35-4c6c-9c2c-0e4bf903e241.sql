
CREATE TABLE public.executive_monthly_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_year int NOT NULL,
  period_month int NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  incidents_total int NOT NULL DEFAULT 0,
  incidents_resolved int NOT NULL DEFAULT 0,
  incidents_critical int NOT NULL DEFAULT 0,
  incidents_high int NOT NULL DEFAULT 0,
  mtta_minutes_avg numeric,
  mttr_minutes_avg numeric,
  mttr_minutes_p95 numeric,
  sla_breaches int NOT NULL DEFAULT 0,
  postmortems_created int NOT NULL DEFAULT 0,
  postmortems_published int NOT NULL DEFAULT 0,
  action_items_total int NOT NULL DEFAULT 0,
  action_items_done int NOT NULL DEFAULT 0,
  action_items_overdue int NOT NULL DEFAULT 0,
  breakdown_by_type jsonb NOT NULL DEFAULT '[]'::jsonb,
  generated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (period_year, period_month)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.executive_monthly_reports TO authenticated;
GRANT ALL ON public.executive_monthly_reports TO service_role;

ALTER TABLE public.executive_monthly_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read monthly reports"
ON public.executive_monthly_reports FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage monthly reports"
ON public.executive_monthly_reports FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_exec_reports_period ON public.executive_monthly_reports(period_year DESC, period_month DESC);

CREATE OR REPLACE FUNCTION public.generate_executive_monthly_report(p_year int DEFAULT NULL, p_month int DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year int;
  v_month int;
  v_start timestamptz;
  v_end timestamptz;
  v_report_id uuid;
  v_inc_total int; v_inc_resolved int; v_inc_crit int; v_inc_high int;
  v_mtta numeric; v_mttr numeric; v_mttr_p95 numeric;
  v_sla_breaches int;
  v_pm_total int; v_pm_pub int;
  v_ai_total int; v_ai_done int; v_ai_over int;
  v_breakdown jsonb;
BEGIN
  IF current_setting('request.jwt.claim.role', true) <> 'service_role'
     AND (auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::app_role)) THEN
    RAISE EXCEPTION 'insufficient_privilege' USING ERRCODE = '42501';
  END IF;

  -- Default = mês anterior
  IF p_year IS NULL OR p_month IS NULL THEN
    v_start := date_trunc('month', now()) - interval '1 month';
  ELSE
    v_start := make_timestamptz(p_year, p_month, 1, 0, 0, 0, 'UTC');
  END IF;
  v_year := EXTRACT(YEAR FROM v_start)::int;
  v_month := EXTRACT(MONTH FROM v_start)::int;
  v_end := v_start + interval '1 month';

  -- Incidentes
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE is_resolved),
    COUNT(*) FILTER (WHERE severity = 'critical'),
    COUNT(*) FILTER (WHERE severity = 'high'),
    ROUND(AVG(EXTRACT(EPOCH FROM (acknowledged_at - created_at)) / 60.0)
      FILTER (WHERE acknowledged_at IS NOT NULL), 2),
    ROUND(AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 60.0)
      FILTER (WHERE is_resolved AND resolved_at IS NOT NULL), 2),
    ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (
      ORDER BY EXTRACT(EPOCH FROM (resolved_at - created_at)) / 60.0
    ) FILTER (WHERE is_resolved AND resolved_at IS NOT NULL)::numeric, 2)
  INTO v_inc_total, v_inc_resolved, v_inc_crit, v_inc_high, v_mtta, v_mttr, v_mttr_p95
  FROM public.security_alerts
  WHERE created_at >= v_start AND created_at < v_end;

  -- SLA breaches
  SELECT COUNT(*) INTO v_sla_breaches
  FROM public.security_alerts
  WHERE alert_type = 'sla_breach'
    AND created_at >= v_start AND created_at < v_end;

  -- Postmortems
  SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'published')
  INTO v_pm_total, v_pm_pub
  FROM public.postmortems
  WHERE created_at >= v_start AND created_at < v_end;

  -- Action items
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE a.status = 'done'),
    COUNT(*) FILTER (WHERE a.status IN ('open','in_progress')
                     AND a.due_date IS NOT NULL AND a.due_date < CURRENT_DATE)
  INTO v_ai_total, v_ai_done, v_ai_over
  FROM public.postmortem_actions a
  JOIN public.postmortems p ON p.id = a.postmortem_id
  WHERE p.created_at >= v_start AND p.created_at < v_end;

  -- Breakdown por tipo
  SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY t.total DESC), '[]'::jsonb)
  INTO v_breakdown
  FROM (
    SELECT
      alert_type,
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE is_resolved) AS resolved,
      ROUND(AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 60.0)
        FILTER (WHERE is_resolved AND resolved_at IS NOT NULL), 2) AS mttr_minutes
    FROM public.security_alerts
    WHERE created_at >= v_start AND created_at < v_end
    GROUP BY alert_type
  ) t;

  INSERT INTO public.executive_monthly_reports (
    period_year, period_month,
    incidents_total, incidents_resolved, incidents_critical, incidents_high,
    mtta_minutes_avg, mttr_minutes_avg, mttr_minutes_p95,
    sla_breaches, postmortems_created, postmortems_published,
    action_items_total, action_items_done, action_items_overdue,
    breakdown_by_type, generated_at
  ) VALUES (
    v_year, v_month,
    COALESCE(v_inc_total, 0), COALESCE(v_inc_resolved, 0),
    COALESCE(v_inc_crit, 0), COALESCE(v_inc_high, 0),
    v_mtta, v_mttr, v_mttr_p95,
    COALESCE(v_sla_breaches, 0),
    COALESCE(v_pm_total, 0), COALESCE(v_pm_pub, 0),
    COALESCE(v_ai_total, 0), COALESCE(v_ai_done, 0), COALESCE(v_ai_over, 0),
    v_breakdown, now()
  )
  ON CONFLICT (period_year, period_month) DO UPDATE SET
    incidents_total = EXCLUDED.incidents_total,
    incidents_resolved = EXCLUDED.incidents_resolved,
    incidents_critical = EXCLUDED.incidents_critical,
    incidents_high = EXCLUDED.incidents_high,
    mtta_minutes_avg = EXCLUDED.mtta_minutes_avg,
    mttr_minutes_avg = EXCLUDED.mttr_minutes_avg,
    mttr_minutes_p95 = EXCLUDED.mttr_minutes_p95,
    sla_breaches = EXCLUDED.sla_breaches,
    postmortems_created = EXCLUDED.postmortems_created,
    postmortems_published = EXCLUDED.postmortems_published,
    action_items_total = EXCLUDED.action_items_total,
    action_items_done = EXCLUDED.action_items_done,
    action_items_overdue = EXCLUDED.action_items_overdue,
    breakdown_by_type = EXCLUDED.breakdown_by_type,
    generated_at = now()
  RETURNING id INTO v_report_id;

  RETURN jsonb_build_object(
    'report_id', v_report_id,
    'period', format('%s-%s', v_year, lpad(v_month::text, 2, '0')),
    'incidents_total', v_inc_total,
    'mttr_minutes_avg', v_mttr,
    'sla_breaches', v_sla_breaches
  );
END;
$$;

REVOKE ALL ON FUNCTION public.generate_executive_monthly_report(int, int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.generate_executive_monthly_report(int, int) TO authenticated, service_role;

-- Cron: todo dia 1 às 06:00 UTC gera relatório do mês anterior
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('exec_monthly_report_generation')
      WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'exec_monthly_report_generation');
    PERFORM cron.schedule(
      'exec_monthly_report_generation',
      '0 6 1 * *',
      $cron$ SELECT public.generate_executive_monthly_report(); $cron$
    );
  END IF;
END
$$;
