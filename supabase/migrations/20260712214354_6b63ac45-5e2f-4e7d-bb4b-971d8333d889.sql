CREATE INDEX IF NOT EXISTS idx_notifications_security_digest
  ON public.notifications (created_at DESC)
  WHERE type = 'security_weekly_digest';

CREATE OR REPLACE FUNCTION public.get_security_digest_history(p_weeks integer DEFAULT 12)
RETURNS TABLE(
  week_key text,
  sla_pct numeric,
  avg_mttr_min numeric,
  total integer,
  pending integer,
  critical integer,
  high integer,
  top jsonb,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT ON (data->>'week_key')
    data->>'week_key' AS week_key,
    (data->>'sla_pct')::numeric AS sla_pct,
    NULLIF(data->>'avg_mttr_min','')::numeric AS avg_mttr_min,
    (data->>'total')::integer AS total,
    (data->>'pending')::integer AS pending,
    (data->>'critical')::integer AS critical,
    (data->>'high')::integer AS high,
    COALESCE(data->'top','[]'::jsonb) AS top,
    created_at
  FROM public.notifications
  WHERE type = 'security_weekly_digest'
    AND data ? 'week_key'
    AND created_at >= now() - (p_weeks || ' weeks')::interval
  ORDER BY data->>'week_key' DESC, created_at DESC
  LIMIT p_weeks;
$$;

REVOKE EXECUTE ON FUNCTION public.get_security_digest_history(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_security_digest_history(integer) TO authenticated;