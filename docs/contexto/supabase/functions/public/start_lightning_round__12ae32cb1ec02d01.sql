CREATE OR REPLACE FUNCTION public.start_lightning_round()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user UUID := auth.uid();
  v_today DATE := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  v_used INTEGER;
  v_key TEXT;
  v_ids UUID[];
  v_session RECORD;
  v_q RECORD;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext('lightning_quiz:' || v_user::text));

  SELECT * INTO v_session FROM public.lightning_quiz_sessions
   WHERE user_id = v_user AND status = 'active' AND deadline_at > now()
   ORDER BY created_at DESC LIMIT 1;

  IF FOUND THEN
    SELECT id, statement, category, difficulty INTO v_q
      FROM public.lightning_quiz_questions
     WHERE id = v_session.question_ids[v_session.current_index + 1];
    RETURN jsonb_build_object(
      'success', true, 'replayed', true,
      'session_id', v_session.id,
      'deadline_at', v_session.deadline_at,
      'total', array_length(v_session.question_ids, 1),
      'index', v_session.current_index,
      'correct_count', v_session.correct_count,
      'wrong_count', v_session.wrong_count,
      'current_streak', v_session.current_streak,
      'question', CASE WHEN v_q.id IS NULL THEN NULL ELSE jsonb_build_object(
        'id', v_q.id, 'statement', v_q.statement,
        'category', v_q.category, 'difficulty', v_q.difficulty) END
    );
  END IF;

  UPDATE public.lightning_quiz_sessions
     SET status = 'finished', finished_at = COALESCE(finished_at, now())
   WHERE user_id = v_user AND status = 'active' AND deadline_at <= now();

  SELECT count(*) INTO v_used FROM public.lightning_quiz_sessions
   WHERE user_id = v_user
     AND (created_at AT TIME ZONE 'America/Sao_Paulo')::date = v_today;

  IF v_used >= 3 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'daily_limit', 'used', v_used, 'limit', 3);
  END IF;

  SELECT array_agg(id) INTO v_ids FROM (
    SELECT id FROM public.lightning_quiz_questions
     WHERE is_active ORDER BY random() LIMIT 10
  ) s;

  IF v_ids IS NULL OR array_length(v_ids, 1) < 3 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'no_questions');
  END IF;

  v_key := 'round:' || v_today::text || ':' || (v_used + 1)::text;
  INSERT INTO public.lightning_quiz_sessions (user_id, dedupe_key, question_ids, deadline_at)
  VALUES (v_user, v_key, v_ids, now() + interval '60 seconds')
  RETURNING * INTO v_session;

  SELECT id, statement, category, difficulty INTO v_q
    FROM public.lightning_quiz_questions WHERE id = v_ids[1];

  RETURN jsonb_build_object(
    'success', true, 'replayed', false,
    'session_id', v_session.id,
    'deadline_at', v_session.deadline_at,
    'total', array_length(v_ids, 1),
    'index', 0, 'correct_count', 0, 'wrong_count', 0, 'current_streak', 0,
    'question', jsonb_build_object(
      'id', v_q.id, 'statement', v_q.statement,
      'category', v_q.category, 'difficulty', v_q.difficulty)
  );
END;
$function$
