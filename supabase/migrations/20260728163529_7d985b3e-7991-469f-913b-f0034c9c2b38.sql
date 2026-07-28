
CREATE OR REPLACE FUNCTION public.save_wager_question(
  p_question text,
  p_options jsonb,
  p_correct_option text,
  p_scheduled_date date,
  p_id uuid DEFAULT NULL,
  p_explanation text DEFAULT NULL,
  p_difficulty text DEFAULT 'medium',
  p_multiplier numeric DEFAULT 2.00,
  p_max_stake integer DEFAULT 100,
  p_is_active boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_question text := btrim(coalesce(p_question, ''));
  v_explanation text := nullif(btrim(coalesce(p_explanation, '')), '');
  v_difficulty text := lower(coalesce(p_difficulty, 'medium'));
  v_multiplier numeric(4,2) := round(coalesce(p_multiplier, 2.00), 2);
  v_max_stake integer := coalesce(p_max_stake, 100);
  v_ids text[];
  v_count integer;
  v_entries integer := 0;
  v_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'unauthenticated');
  END IF;
  IF NOT (has_role(v_uid, 'admin'::app_role) OR has_role(v_uid, 'manager'::app_role)) THEN
    RETURN jsonb_build_object('success', false, 'reason', 'forbidden');
  END IF;

  IF length(v_question) < 5 OR length(v_question) > 500 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_question');
  END IF;

  IF p_options IS NULL OR jsonb_typeof(p_options) <> 'array' THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_options');
  END IF;

  SELECT array_agg(btrim(elem->>'id')), count(*)
    INTO v_ids, v_count
  FROM jsonb_array_elements(p_options) AS elem
  WHERE nullif(btrim(coalesce(elem->>'id', '')), '') IS NOT NULL
    AND nullif(btrim(coalesce(elem->>'label', '')), '') IS NOT NULL;

  IF v_count IS NULL OR v_count < 2 OR v_count > 6 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_options');
  END IF;
  IF (SELECT count(DISTINCT x) FROM unnest(v_ids) AS x) <> v_count THEN
    RETURN jsonb_build_object('success', false, 'reason', 'duplicate_options');
  END IF;
  IF btrim(coalesce(p_correct_option, '')) = '' OR NOT (btrim(p_correct_option) = ANY (v_ids)) THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_correct_option');
  END IF;

  IF v_difficulty NOT IN ('easy', 'medium', 'hard') THEN
    v_difficulty := 'medium';
  END IF;
  IF v_multiplier < 1.10 OR v_multiplier > 5.00 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_multiplier');
  END IF;
  IF v_max_stake < 10 OR v_max_stake > 1000 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_max_stake');
  END IF;
  IF p_scheduled_date IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_date');
  END IF;

  IF p_id IS NOT NULL THEN
    SELECT count(*) INTO v_entries FROM wager_entries WHERE question_id = p_id;
    IF NOT EXISTS (SELECT 1 FROM wager_questions WHERE id = p_id) THEN
      RETURN jsonb_build_object('success', false, 'reason', 'not_found');
    END IF;
  END IF;

  -- Uma pergunta já respondida é imutável no conteúdo: alterar o gabarito
  -- corromperia apostas liquidadas. Só explicação/ativação continuam editáveis.
  IF v_entries > 0 THEN
    UPDATE wager_questions
       SET explanation = v_explanation,
           is_active = p_is_active,
           updated_at = now()
     WHERE id = p_id;
    RETURN jsonb_build_object('success', true, 'id', p_id, 'locked', true, 'entries', v_entries);
  END IF;

  -- Garante o índice único parcial (uma pergunta ativa por data).
  IF p_is_active THEN
    UPDATE wager_questions
       SET is_active = false, updated_at = now()
     WHERE scheduled_date = p_scheduled_date
       AND is_active
       AND (p_id IS NULL OR id <> p_id);
  END IF;

  IF p_id IS NULL THEN
    INSERT INTO wager_questions (
      question, options, correct_option, explanation, difficulty,
      base_multiplier, max_stake, scheduled_date, is_active, created_by
    ) VALUES (
      v_question, p_options, btrim(p_correct_option), v_explanation, v_difficulty,
      v_multiplier, v_max_stake, p_scheduled_date, p_is_active, v_uid
    ) RETURNING id INTO v_id;
  ELSE
    UPDATE wager_questions
       SET question = v_question,
           options = p_options,
           correct_option = btrim(p_correct_option),
           explanation = v_explanation,
           difficulty = v_difficulty,
           base_multiplier = v_multiplier,
           max_stake = v_max_stake,
           scheduled_date = p_scheduled_date,
           is_active = p_is_active,
           updated_at = now()
     WHERE id = p_id
     RETURNING id INTO v_id;
  END IF;

  RETURN jsonb_build_object('success', true, 'id', v_id, 'locked', false, 'entries', 0);
END;
$$;

REVOKE ALL ON FUNCTION public.save_wager_question(text, jsonb, text, date, uuid, text, text, numeric, integer, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_wager_question(text, jsonb, text, date, uuid, text, text, numeric, integer, boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.list_wager_questions(
  p_from date DEFAULT (CURRENT_DATE - 30),
  p_to date DEFAULT (CURRENT_DATE + 60)
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

REVOKE ALL ON FUNCTION public.list_wager_questions(date, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_wager_questions(date, date) TO authenticated;
