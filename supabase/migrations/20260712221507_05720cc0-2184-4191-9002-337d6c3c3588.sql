CREATE OR REPLACE FUNCTION public.get_incident_metrics(p_days integer DEFAULT 30)
RETURNS TABLE (
  week_start date,
  alert_type text,
  incidents bigint,
  acknowledged bigint,
  resolved bigint,
  mtta_seconds numeric,
  mttr_seconds numeric,
  p95_mttr_seconds numeric
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
  ORDER BY 1 DESC, 3 DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.get_incident_metrics(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_incident_metrics(integer) TO authenticated;