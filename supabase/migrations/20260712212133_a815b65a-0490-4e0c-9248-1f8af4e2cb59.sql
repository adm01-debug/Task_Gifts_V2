
CREATE OR REPLACE FUNCTION public.get_alert_mttr_by_type_7d()
RETURNS TABLE (
  alert_type text,
  total_count bigint,
  resolved_count bigint,
  unresolved_count bigint,
  avg_mttr_minutes numeric,
  median_mttr_minutes numeric,
  max_mttr_minutes numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'access denied';
  END IF;

  RETURN QUERY
  SELECT
    sa.alert_type,
    COUNT(*)::bigint AS total_count,
    COUNT(*) FILTER (WHERE sa.is_resolved)::bigint AS resolved_count,
    COUNT(*) FILTER (WHERE NOT sa.is_resolved)::bigint AS unresolved_count,
    ROUND(AVG(EXTRACT(EPOCH FROM (sa.resolved_at - sa.created_at)) / 60.0)
      FILTER (WHERE sa.is_resolved AND sa.resolved_at IS NOT NULL), 2) AS avg_mttr_minutes,
    ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (
      ORDER BY EXTRACT(EPOCH FROM (sa.resolved_at - sa.created_at)) / 60.0
    ) FILTER (WHERE sa.is_resolved AND sa.resolved_at IS NOT NULL)::numeric, 2) AS median_mttr_minutes,
    ROUND(MAX(EXTRACT(EPOCH FROM (sa.resolved_at - sa.created_at)) / 60.0)
      FILTER (WHERE sa.is_resolved AND sa.resolved_at IS NOT NULL), 2) AS max_mttr_minutes
  FROM public.security_alerts sa
  WHERE sa.created_at >= now() - INTERVAL '7 days'
  GROUP BY sa.alert_type
  ORDER BY total_count DESC;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_alert_mttr_by_type_7d() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_alert_mttr_by_type_7d() TO authenticated;
