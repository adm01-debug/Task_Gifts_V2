CREATE OR REPLACE FUNCTION public.get_push_outbox_health_trend(p_hours integer DEFAULT 48)
 RETURNS TABLE(bucket timestamp with time zone, avg_score numeric, min_score integer, max_pending integer, max_failed integer, critical_count integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  p_hours := LEAST(GREATEST(COALESCE(p_hours, 48), 1), 720);

  RETURN QUERY
  SELECT
    date_trunc('hour', s.created_at) AS bucket,
    round(AVG(s.score), 1) AS avg_score,
    MIN(s.score)::integer AS min_score,
    MAX(s.pending)::integer AS max_pending,
    MAX(s.failed)::integer AS max_failed,
    COUNT(*) FILTER (WHERE s.severity = 'critical')::integer AS critical_count
  FROM public.push_outbox_health_snapshots s
  WHERE s.created_at >= now() - make_interval(hours => p_hours)
  GROUP BY 1
  ORDER BY 1;
END;
$function$
