CREATE OR REPLACE FUNCTION public.finish_lightning_round(p_session_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user UUID := auth.uid();
  v_s RECORD;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;

  SELECT * INTO v_s FROM public.lightning_quiz_sessions
   WHERE id = p_session_id AND user_id = v_user FOR UPDATE;

  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'reason', 'not_found'); END IF;
  IF v_s.status = 'finished' THEN RETURN jsonb_build_object('success', false, 'reason', 'already_finished'); END IF;

  UPDATE public.lightning_quiz_sessions
     SET status = 'finished', finished_at = now(),
         current_index = array_length(question_ids, 1)
   WHERE id = p_session_id
  RETURNING * INTO v_s;

  RETURN jsonb_build_object(
    'success', true,
    'total', array_length(v_s.question_ids, 1),
    'correct_count', v_s.correct_count,
    'wrong_count', v_s.wrong_count,
    'best_streak', v_s.best_streak
  );
END;
$function$
