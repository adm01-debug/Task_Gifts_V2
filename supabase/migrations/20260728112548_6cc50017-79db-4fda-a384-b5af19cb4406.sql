CREATE OR REPLACE FUNCTION public.get_push_outbox_health(p_hours integer DEFAULT 24)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_since timestamptz;
  v_stuck_cutoff timestamptz;
  v_result jsonb;
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  p_hours := LEAST(GREATEST(COALESCE(p_hours, 24), 1), 720);
  v_since := now() - make_interval(hours => p_hours);
  v_stuck_cutoff := now() - interval '5 minutes';

  SELECT jsonb_build_object(
    'window_hours', p_hours,
    'pending', COALESCE(SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END), 0),
    'processing', COALESCE(SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END), 0),
    'stuck', COALESCE(SUM(CASE WHEN status = 'processing' AND updated_at < v_stuck_cutoff THEN 1 ELSE 0 END), 0),
    'sent', COALESCE(SUM(CASE WHEN status = 'sent' AND processed_at >= v_since THEN 1 ELSE 0 END), 0),
    'failed', COALESCE(SUM(CASE WHEN status = 'failed' AND processed_at >= v_since THEN 1 ELSE 0 END), 0),
    'skipped', COALESCE(SUM(CASE WHEN status = 'skipped' AND processed_at >= v_since THEN 1 ELSE 0 END), 0),
    'oldest_pending_minutes', COALESCE(
      FLOOR(EXTRACT(EPOCH FROM (now() - MIN(CASE WHEN status = 'pending' THEN created_at END))) / 60), 0),
    'minutes_since_last_dispatch',
      CASE WHEN MAX(processed_at) IS NULL THEN NULL
           ELSE FLOOR(EXTRACT(EPOCH FROM (now() - MAX(processed_at))) / 60) END
  )
  INTO v_result
  FROM public.push_outbox;

  v_result := v_result || jsonb_build_object(
    'top_errors', COALESCE((
      SELECT jsonb_agg(e) FROM (
        SELECT jsonb_build_object('error', COALESCE(last_error, 'desconhecido'), 'count', COUNT(*)) AS e
        FROM public.push_outbox
        WHERE status = 'failed' AND processed_at >= v_since
        GROUP BY COALESCE(last_error, 'desconhecido')
        ORDER BY COUNT(*) DESC
        LIMIT 5
      ) t
    ), '[]'::jsonb),
    'recent_failures', COALESCE((
      SELECT jsonb_agg(f) FROM (
        SELECT jsonb_build_object(
          'id', id, 'type', type, 'title', title,
          'attempts', attempts, 'last_error', last_error, 'created_at', created_at
        ) AS f
        FROM public.push_outbox
        WHERE status = 'failed'
        ORDER BY updated_at DESC
        LIMIT 20
      ) t
    ), '[]'::jsonb)
  );

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_push_outbox_health(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_push_outbox_health(integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.requeue_push_outbox(p_ids uuid[] DEFAULT NULL, p_include_stuck boolean DEFAULT true)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  WITH target AS (
    SELECT id FROM public.push_outbox
    WHERE (
      (p_ids IS NOT NULL AND id = ANY(p_ids) AND status IN ('failed', 'processing'))
      OR (p_ids IS NULL AND (
            status = 'failed'
         OR (p_include_stuck AND status = 'processing' AND updated_at < now() - interval '5 minutes')
      ))
    )
    LIMIT 500
    FOR UPDATE SKIP LOCKED
  ), upd AS (
    UPDATE public.push_outbox o
    SET status = 'pending', attempts = 0, last_error = NULL, processed_at = NULL, updated_at = now()
    FROM target WHERE o.id = target.id
    RETURNING o.id
  )
  SELECT COUNT(*) INTO v_count FROM upd;

  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.requeue_push_outbox(uuid[], boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.requeue_push_outbox(uuid[], boolean) TO authenticated;