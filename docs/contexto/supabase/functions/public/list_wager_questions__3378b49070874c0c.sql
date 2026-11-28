CREATE OR REPLACE FUNCTION public.list_wager_questions(p_from date DEFAULT (CURRENT_DATE - 30), p_to date DEFAULT (CURRENT_DATE + 60))
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_rows jsonb;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'unauthenticated');
  END IF;
  IF NOT (has_role(v_uid, 'admin'::app_role) OR has_role(v_uid, 'manager'::app_role)) THEN
    RETURN jsonb_build_object('success', false, 'reason', 'forbidden');
  END IF;

  SELECT coalesce(jsonb_agg(row_to_json(t)::jsonb ORDER BY t.scheduled_date DESC), '[]'::jsonb)
    INTO v_rows
  FROM (
    SELECT q.id,
           q.question,
           q.options,
           q.correct_option,
           q.explanation,
           q.difficulty,
           q.base_multiplier,
           q.max_stake,
           q.scheduled_date,
           q.is_active,
           coalesce(s.total_entries, 0) AS total_entries,
           coalesce(s.correct_entries, 0) AS correct_entries,
           coalesce(s.total_staked, 0) AS total_staked,
           coalesce(s.coins_delta, 0) AS coins_delta
      FROM wager_questions q
      LEFT JOIN (
        SELECT question_id,
               count(*) AS total_entries,
               count(*) FILTER (WHERE is_correct) AS correct_entries,
               sum(stake_coins) AS total_staked,
               sum(coins_delta) AS coins_delta
          FROM wager_entries
         GROUP BY question_id
      ) s ON s.question_id = q.id
     WHERE q.scheduled_date BETWEEN p_from AND p_to
  ) t;

  RETURN jsonb_build_object('success', true, 'questions', v_rows);
END;
$function$
