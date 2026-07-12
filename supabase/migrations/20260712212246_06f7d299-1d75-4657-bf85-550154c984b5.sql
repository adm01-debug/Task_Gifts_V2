
CREATE OR REPLACE FUNCTION public.get_alert_heatmap_30d()
RETURNS TABLE (
  dow smallint,
  hour smallint,
  total bigint,
  critical_count bigint,
  high_count bigint
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
    EXTRACT(DOW FROM sa.created_at)::smallint AS dow,
    EXTRACT(HOUR FROM sa.created_at)::smallint AS hour,
    COUNT(*)::bigint AS total,
    COUNT(*) FILTER (WHERE sa.severity = 'critical')::bigint AS critical_count,
    COUNT(*) FILTER (WHERE sa.severity = 'high')::bigint AS high_count
  FROM public.security_alerts sa
  WHERE sa.created_at >= now() - INTERVAL '30 days'
  GROUP BY 1, 2
  ORDER BY 1, 2;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_alert_heatmap_30d() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_alert_heatmap_30d() TO authenticated;
