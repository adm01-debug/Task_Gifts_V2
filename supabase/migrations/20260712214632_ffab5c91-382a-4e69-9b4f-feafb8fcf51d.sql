
DROP FUNCTION IF EXISTS public.get_security_digest_history(integer);

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
  created_at timestamp with time zone,
  ack_count integer,
  acknowledged_by_me boolean,
  acknowledgments jsonb
)
LANGUAGE sql
STABLE SECURITY DEFINER
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
    created_at,
    COALESCE(jsonb_array_length(data->'acknowledgments'), 0) AS ack_count,
    COALESCE(
      (data->'acknowledgments') @> jsonb_build_array(jsonb_build_object('user_id', auth.uid()))::jsonb,
      false
    ) AS acknowledged_by_me,
    COALESCE(data->'acknowledgments', '[]'::jsonb) AS acknowledgments
  FROM public.notifications
  WHERE type = 'security_weekly_digest'
    AND data ? 'week_key'
    AND created_at >= now() - (p_weeks || ' weeks')::interval
  ORDER BY data->>'week_key' DESC, created_at DESC
  LIMIT p_weeks;
$$;

REVOKE ALL ON FUNCTION public.get_security_digest_history(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_security_digest_history(integer) TO authenticated;
