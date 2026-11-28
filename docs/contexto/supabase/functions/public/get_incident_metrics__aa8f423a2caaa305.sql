CREATE OR REPLACE FUNCTION public.get_incident_metrics(p_days integer DEFAULT 30)
 RETURNS TABLE(week_start date, alert_type text, incidents bigint, acknowledged bigint, resolved bigint, mtta_seconds numeric, mttr_seconds numeric, p95_mttr_seconds numeric, mtta_target_seconds integer, mttr_target_seconds integer, mtta_breached boolean, mttr_breached boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
