CREATE INDEX IF NOT EXISTS idx_sequence_attempts_proc_user_date
  ON public.sequence_attempts (procedure_id, user_id, attempt_date);

CREATE OR REPLACE FUNCTION public.get_sequence_procedure_stats(
  p_procedure_id uuid,
  p_days integer DEFAULT 30
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_days integer := GREATEST(1, LEAST(365, COALESCE(p_days, 30)));
  v_since date := ((now() AT TIME ZONE 'utc')::date - (v_days - 1));
  v_summary jsonb;
  v_leaderboard jsonb;
  v_steps jsonb;
  v_daily jsonb;
  v_recent jsonb;
BEGIN
  PERFORM public._require_admin();

  IF p_procedure_id IS NULL
     OR NOT EXISTS (SELECT 1 FROM public.sequence_procedures WHERE id = p_procedure_id) THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_found');
  END IF;

  SELECT jsonb_build_object(
    'attempts', COUNT(*),
    'players', COUNT(DISTINCT user_id),
    'perfect_attempts', COUNT(*) FILTER (WHERE is_perfect),
    'avg_accuracy', CASE WHEN COUNT(*) = 0 THEN 0 ELSE
      ROUND(AVG(CASE WHEN steps_total > 0
                     THEN correct_positions::numeric / steps_total ELSE 0 END) * 100, 1) END,
    'avg_duration_ms', COALESCE(ROUND(AVG(duration_ms))::int, 0),
    'best_duration_ms', COALESCE(MIN(duration_ms) FILTER (WHERE is_perfect), 0),
    'coins_awarded', COALESCE(SUM(coins_awarded), 0),
    'xp_awarded', COALESCE(SUM(xp_awarded), 0)
  )
  INTO v_summary
  FROM public.sequence_attempts
  WHERE procedure_id = p_procedure_id
    AND attempt_date >= v_since;

  WITH per_user AS (
    SELECT
      a.user_id,
      COUNT(*)::int AS attempts,
      COUNT(*) FILTER (WHERE a.is_perfect)::int AS perfect_attempts,
      ROUND(MAX(CASE WHEN a.steps_total > 0
                     THEN a.correct_positions::numeric / a.steps_total ELSE 0 END) * 100, 1) AS best_accuracy,
      COALESCE(MIN(a.duration_ms) FILTER (WHERE a.is_perfect), MIN(a.duration_ms))::int AS best_duration_ms,
      COALESCE(SUM(a.coins_awarded), 0)::int AS coins_awarded
    FROM public.sequence_attempts a
    WHERE a.procedure_id = p_procedure_id
      AND a.attempt_date >= v_since
    GROUP BY a.user_id
  ), ranked AS (
    SELECT
      pu.user_id,
      COALESCE(p.display_name, 'Participante') AS display_name,
      p.avatar_url,
      pu.attempts,
      pu.perfect_attempts,
      pu.best_accuracy,
      pu.best_duration_ms,
      pu.coins_awarded
    FROM per_user pu
    LEFT JOIN public.profiles p ON p.id = pu.user_id
    ORDER BY pu.perfect_attempts DESC, pu.best_accuracy DESC, pu.best_duration_ms ASC
    LIMIT 20
  )
  SELECT COALESCE(jsonb_agg(to_jsonb(ranked)), '[]'::jsonb) INTO v_leaderboard FROM ranked;

  WITH ordered AS (
    SELECT u.ord::int AS position, u.step_id
    FROM public.sequence_attempts a
    CROSS JOIN LATERAL unnest(a.submitted_order) WITH ORDINALITY AS u(step_id, ord)
    WHERE a.procedure_id = p_procedure_id
      AND a.attempt_date >= v_since
  ), by_step AS (
    SELECT
      s.id AS step_id,
      s.label,
      s.position,
      COUNT(o.position)::int AS evaluated,
      COUNT(*) FILTER (WHERE o.step_id = s.id)::int AS correct
    FROM public.sequence_steps s
    LEFT JOIN ordered o ON o.position = s.position
    WHERE s.procedure_id = p_procedure_id
    GROUP BY s.id, s.label, s.position
    ORDER BY s.position
  )
  SELECT COALESCE(jsonb_agg(to_jsonb(by_step)), '[]'::jsonb) INTO v_steps FROM by_step;

  WITH daily AS (
    SELECT
      a.attempt_date AS day,
      COUNT(*)::int AS attempts,
      COUNT(*) FILTER (WHERE a.is_perfect)::int AS perfect_attempts
    FROM public.sequence_attempts a
    WHERE a.procedure_id = p_procedure_id
      AND a.attempt_date >= v_since
    GROUP BY a.attempt_date
    ORDER BY a.attempt_date
  )
  SELECT COALESCE(jsonb_agg(to_jsonb(daily)), '[]'::jsonb) INTO v_daily FROM daily;

  WITH recent AS (
    SELECT
      a.id,
      a.user_id,
      COALESCE(p.display_name, 'Participante') AS display_name,
      a.steps_total,
      a.correct_positions,
      a.is_perfect,
      a.duration_ms,
      a.coins_awarded,
      a.xp_awarded,
      a.created_at
    FROM public.sequence_attempts a
    LEFT JOIN public.profiles p ON p.id = a.user_id
    WHERE a.procedure_id = p_procedure_id
      AND a.attempt_date >= v_since
    ORDER BY a.created_at DESC
    LIMIT 25
  )
  SELECT COALESCE(jsonb_agg(to_jsonb(recent)), '[]'::jsonb) INTO v_recent FROM recent;

  RETURN jsonb_build_object(
    'success', true,
    'procedure_id', p_procedure_id,
    'days', v_days,
    'since', v_since,
    'summary', v_summary,
    'leaderboard', v_leaderboard,
    'steps', v_steps,
    'daily', v_daily,
    'recent', v_recent
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_sequence_procedure_stats(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_sequence_procedure_stats(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_sequence_procedure_stats(uuid, integer) TO service_role;