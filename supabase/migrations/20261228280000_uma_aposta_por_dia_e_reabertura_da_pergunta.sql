-- Corrige dois furos da aposta diaria abertos pela troca da pergunta (20261228270000) e o
-- historico de perguntas substituidas.
--
-- 1) submit_daily_wager: a unicidade de wager_entries e por (question_id, user_id). Quando a equipe
--    publica outra pergunta para a mesma data, o novo question_id liberava uma segunda aposta e uma
--    segunda liquidacao no mesmo dia. Agora vale uma participacao por jogador por data de negocio,
--    checada depois de travar o perfil (o lock serializa cliques concorrentes).
-- 2) get_daily_wager: passa a devolver a participacao ja liquidada do dia mesmo quando a pergunta
--    original foi substituida, em vez de abrir um formulario novo.
-- 3) save_wager_question: reabrir uma pergunta ja respondida desativa antes a substituta ativa da
--    mesma data (sem isso o indice unico parcial de pergunta ativa recusa a edicao e o painel nao
--    consegue restaurar a pergunta).
-- 4) RLS: o historico do jogador mostrava "Pergunta removida" porque wager_questions_user_select so
--    le perguntas ativas. A politica nova libera a leitura das perguntas em que o proprio jogador
--    apostou, sem expor pergunta de terceiros.
--
-- Corpos identicos aos vigentes em producao (comparados por pg_get_functiondef antes desta rodada).

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
    -- Reabrir uma pergunta ja respondida precisa liberar a data: a substituta ativa da mesma
    -- scheduled_date continuaria ativa e o indice unico parcial recusaria a edicao.
    IF p_is_active THEN
      UPDATE wager_questions
         SET is_active = false, updated_at = now()
       WHERE is_active
         AND id <> p_id
         AND scheduled_date = (SELECT q.scheduled_date FROM wager_questions q WHERE q.id = p_id);
    END IF;
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

CREATE OR REPLACE FUNCTION public.get_daily_wager()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_today date := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  v_q public.wager_questions%ROWTYPE;
  v_entry public.wager_entries%ROWTYPE;
  v_balance integer := 0;
  v_has_entry boolean := false;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'unauthenticated');
  END IF;

  SELECT * INTO v_q FROM public.wager_questions
  WHERE is_active AND scheduled_date = v_today
  LIMIT 1;

  SELECT COALESCE(coins, 0) INTO v_balance FROM public.profiles WHERE id = v_user;

  IF v_q.id IS NOT NULL THEN
    SELECT * INTO v_entry FROM public.wager_entries
    WHERE question_id = v_q.id AND user_id = v_user;
  END IF;

  -- Uma participacao por dia: com a pergunta trocada depois da aposta, a entrada e a pergunta
  -- original continuam sendo a resposta do dia, sem novo formulario nem nova liquidacao.
  IF v_entry.id IS NULL THEN
    SELECT e.* INTO v_entry
      FROM public.wager_entries e
      JOIN public.wager_questions w ON w.id = e.question_id
     WHERE e.user_id = v_user
       AND w.scheduled_date = v_today
     ORDER BY e.created_at
     LIMIT 1;

    IF v_entry.id IS NOT NULL THEN
      SELECT * INTO v_q FROM public.wager_questions WHERE id = v_entry.question_id;
    END IF;
  END IF;

  IF v_q.id IS NULL THEN
    RETURN jsonb_build_object('success', true, 'question', NULL, 'balance', COALESCE(v_balance, 0));
  END IF;

  v_has_entry := v_entry.id IS NOT NULL;

  RETURN jsonb_build_object(
    'success', true,
    'balance', COALESCE(v_balance, 0),
    'question', jsonb_build_object(
      'id', v_q.id,
      'question', v_q.question,
      'options', v_q.options,
      'difficulty', v_q.difficulty,
      'multiplier', v_q.base_multiplier,
      'max_stake', v_q.max_stake,
      'scheduled_date', v_q.scheduled_date,
      'correct_option', CASE WHEN v_has_entry THEN v_q.correct_option ELSE NULL END,
      'explanation', CASE WHEN v_has_entry THEN v_q.explanation ELSE NULL END
    ),
    'entry', CASE WHEN v_has_entry THEN jsonb_build_object(
      'id', v_entry.id,
      'stake_coins', v_entry.stake_coins,
      'chosen_option', v_entry.chosen_option,
      'is_correct', v_entry.is_correct,
      'multiplier', v_entry.multiplier,
      'coins_delta', v_entry.coins_delta,
      'xp_awarded', v_entry.xp_awarded,
      'created_at', v_entry.created_at
    ) ELSE NULL END
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_daily_wager(
  p_question_id uuid,
  p_option text,
  p_stake integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_today date := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  v_q public.wager_questions%ROWTYPE;
  v_stake integer;
  v_balance integer;
  v_correct boolean;
  v_delta integer;
  v_xp integer;
  v_entry_id uuid;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'unauthenticated');
  END IF;

  SELECT * INTO v_q FROM public.wager_questions
  WHERE id = p_question_id AND is_active AND scheduled_date = v_today;

  IF v_q.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_found');
  END IF;

  IF p_option IS NULL OR NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements(v_q.options) o
    WHERE o->>'id' = p_option
  ) THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_option');
  END IF;

  v_stake := FLOOR(COALESCE(p_stake, 0));
  IF v_stake < 1 OR v_stake > v_q.max_stake THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_stake', 'max_stake', v_q.max_stake);
  END IF;

  -- Trava a linha do perfil para evitar corrida em cliques simultâneos.
  SELECT COALESCE(coins, 0) INTO v_balance FROM public.profiles WHERE id = v_user FOR UPDATE;
  IF v_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'no_profile');
  END IF;
  IF v_balance < v_stake THEN
    RETURN jsonb_build_object('success', false, 'reason', 'insufficient_coins', 'balance', v_balance);
  END IF;

  -- Uma participacao por jogador por dia, qualquer que seja a pergunta ativa: a troca da pergunta
  -- gera outro question_id e a unicidade por (question_id, user_id) nao cobre esse caso.
  IF EXISTS (
    SELECT 1
      FROM public.wager_entries e
      JOIN public.wager_questions w ON w.id = e.question_id
     WHERE e.user_id = v_user
       AND w.scheduled_date = v_today
  ) THEN
    RETURN jsonb_build_object('success', false, 'reason', 'already_answered');
  END IF;

  v_correct := (p_option = v_q.correct_option);
  IF v_correct THEN
    v_delta := FLOOR(v_stake * (v_q.base_multiplier - 1))::integer;
    v_xp := LEAST(200, GREATEST(10, v_delta));
  ELSE
    v_delta := -v_stake;
    v_xp := 0;
  END IF;

  BEGIN
    INSERT INTO public.wager_entries (
      question_id, user_id, stake_coins, chosen_option,
      is_correct, multiplier, coins_delta, xp_awarded
    ) VALUES (
      v_q.id, v_user, v_stake, p_option,
      v_correct, v_q.base_multiplier, v_delta, v_xp
    ) RETURNING id INTO v_entry_id;
  EXCEPTION WHEN unique_violation THEN
    RETURN jsonb_build_object('success', false, 'reason', 'already_answered');
  END;

  UPDATE public.profiles
  SET coins = GREATEST(0, COALESCE(coins, 0) + v_delta),
      xp = COALESCE(xp, 0) + v_xp,
      updated_at = now()
  WHERE id = v_user
  RETURNING coins INTO v_balance;

  RETURN jsonb_build_object(
    'success', true,
    'entry_id', v_entry_id,
    'is_correct', v_correct,
    'stake_coins', v_stake,
    'multiplier', v_q.base_multiplier,
    'coins_delta', v_delta,
    'xp_awarded', v_xp,
    'balance', v_balance,
    'correct_option', v_q.correct_option,
    'explanation', v_q.explanation
  );
END;
$$;
REVOKE ALL ON FUNCTION public.save_wager_question(text, jsonb, text, date, uuid, text, text, numeric, integer, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_wager_question(text, jsonb, text, date, uuid, text, text, numeric, integer, boolean) TO authenticated;
REVOKE ALL ON FUNCTION public.get_daily_wager() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_daily_wager() TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.submit_daily_wager(uuid, text, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_daily_wager(uuid, text, integer) TO authenticated, service_role;

-- Historico: o jogador enxerga a pergunta original das proprias apostas mesmo depois da substituicao.
DROP POLICY IF EXISTS wager_questions_user_select_own_entries ON public.wager_questions;
CREATE POLICY wager_questions_user_select_own_entries ON public.wager_questions
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.wager_entries e
     WHERE e.question_id = wager_questions.id
       AND e.user_id = auth.uid()
  ));
