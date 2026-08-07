-- ============================================================
-- RELÂMPAGO: cria apenas as RPCs que faltam
-- Tabelas lightning_quiz_sessions e lightning_quiz_answers
-- ja existem no banco. Este script soh cria as funcoes.
-- Cole no SQL Editor do Supabase Dashboard.
-- ============================================================

-- Limpa a linha stale da sessao anterior (tabela vazia exceto por isso)
DELETE FROM public.lightning_quiz_sessions WHERE dedupe_key = 'x' OR question_ids = '{}';

-- ── RPC: start_lightning_round ────────────────────────────────
CREATE OR REPLACE FUNCTION public.start_lightning_round()
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
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
$$;

-- ── RPC: answer_lightning_question ────────────────────────────
CREATE OR REPLACE FUNCTION public.answer_lightning_question(
  p_session_id UUID, p_idx INTEGER, p_answer BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
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
$$;

-- ── RPC: finish_lightning_round ───────────────────────────────
CREATE OR REPLACE FUNCTION public.finish_lightning_round(p_session_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
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
$$;
