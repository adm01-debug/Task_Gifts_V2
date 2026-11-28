CREATE OR REPLACE FUNCTION public.answer_lightning_question(p_session_id uuid, p_idx integer, p_answer boolean)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user UUID := auth.uid();
  v_s RECORD;
  v_qid UUID;
  v_correct BOOLEAN;
  v_expected BOOLEAN;
  v_explanation TEXT;
  v_elapsed INTEGER;
  v_total INTEGER;
  v_next RECORD;
  v_streak INTEGER;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext('lightning_quiz:' || v_user::text));

  SELECT * INTO v_s FROM public.lightning_quiz_sessions
   WHERE id = p_session_id AND user_id = v_user FOR UPDATE;

  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'reason', 'not_found'); END IF;
  IF v_s.status <> 'active' THEN RETURN jsonb_build_object('success', false, 'reason', 'finished'); END IF;
  IF v_s.deadline_at <= now() THEN RETURN jsonb_build_object('success', false, 'reason', 'expired'); END IF;
  IF p_idx IS DISTINCT FROM v_s.current_index THEN
    RETURN jsonb_build_object('success', false, 'reason', 'out_of_order', 'index', v_s.current_index);
  END IF;

  v_total := array_length(v_s.question_ids, 1);
  v_qid := v_s.question_ids[v_s.current_index + 1];
  IF v_qid IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'completed'); END IF;

  SELECT is_true, explanation INTO v_expected, v_explanation
    FROM public.lightning_quiz_questions WHERE id = v_qid;

  v_correct := (COALESCE(p_answer, false) = v_expected);
  v_elapsed := GREATEST(0, LEAST(60000,
    (EXTRACT(EPOCH FROM (now() - COALESCE(
      (SELECT max(created_at) FROM public.lightning_quiz_answers WHERE session_id = v_s.id),
      v_s.started_at))) * 1000)::int));

  INSERT INTO public.lightning_quiz_answers
    (session_id, user_id, question_id, idx, answered_true, is_correct, elapsed_ms)
  VALUES (v_s.id, v_user, v_qid, v_s.current_index, COALESCE(p_answer, false), v_correct, v_elapsed)
  ON CONFLICT (session_id, idx) DO NOTHING;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'reason', 'race'); END IF;

  v_streak := CASE WHEN v_correct THEN v_s.current_streak + 1 ELSE 0 END;
  UPDATE public.lightning_quiz_sessions
     SET current_index = current_index + 1,
         correct_count = correct_count + CASE WHEN v_correct THEN 1 ELSE 0 END,
         wrong_count = wrong_count + CASE WHEN v_correct THEN 0 ELSE 1 END,
         current_streak = v_streak,
         best_streak = GREATEST(best_streak, v_streak)
   WHERE id = v_s.id AND current_index = p_idx
  RETURNING * INTO v_s;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'reason', 'race'); END IF;

  IF v_s.current_index < v_total THEN
    SELECT id, statement, category, difficulty INTO v_next
      FROM public.lightning_quiz_questions
     WHERE id = v_s.question_ids[v_s.current_index + 1];
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'is_correct', v_correct,
    'expected', v_expected,
    'explanation', v_explanation,
    'elapsed_ms', v_elapsed,
    'index', v_s.current_index,
    'total', v_total,
    'correct_count', v_s.correct_count,
    'wrong_count', v_s.wrong_count,
    'current_streak', v_s.current_streak,
    'best_streak', v_s.best_streak,
    'completed', v_s.current_index >= v_total,
    'question', CASE WHEN v_next.id IS NULL THEN NULL ELSE jsonb_build_object(
      'id', v_next.id, 'statement', v_next.statement,
      'category', v_next.category, 'difficulty', v_next.difficulty) END
  );
END;
$function$
