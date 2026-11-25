-- Duas corridas fechadas, ambas descobertas em revisao desta PR:
--
-- 1) A meta departamental em boss_win_rate_goals era ON DELETE SET NULL. Como existe um indice
--    unico para a meta global, excluir um departamento que tinha meta ou esbarrava em 23505 ou
--    transformava a meta local em global. O painel passou a apagar a meta numa requisicao separada,
--    o que nao e atomico: se a exclusao do departamento falhasse, a meta era perdida sem volta.
--    A meta pertence ao ciclo de vida do departamento, entao a FK passa a ON DELETE CASCADE e a
--    exclusao volta a ser um unico DELETE.
--
-- 2) submit_daily_wager lia a pergunta sem trava e save_wager_question contava as apostas antes de
--    travar a linha. Um reagendamento concorrente movia scheduled_date entre a leitura e a
--    gravacao: a aposta era liquidada com os dados antigos, mas o limite diario passava a contar
--    aquela aposta como participacao do dia seguinte. Agora o envio segura FOR SHARE na pergunta e
--    o agendamento segura FOR UPDATE antes de contar.

-- 1) FK da meta departamental: ON DELETE CASCADE
DO $$
DECLARE
  v_nome text;
BEGIN
  SELECT c.conname INTO v_nome
    FROM pg_constraint c
    JOIN pg_attribute a
      ON a.attrelid = c.conrelid
     AND a.attnum = ANY (c.conkey)
   WHERE c.conrelid = 'public.boss_win_rate_goals'::regclass
     AND c.contype = 'f'
     AND a.attname = 'department_id';

  IF v_nome IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.boss_win_rate_goals DROP CONSTRAINT %I', v_nome);
  END IF;
END $$;

ALTER TABLE public.boss_win_rate_goals
  ADD CONSTRAINT boss_win_rate_goals_department_id_fkey
  FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE CASCADE;

-- 2) Travas de concorrencia da aposta diaria
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
    -- Trava a linha antes de contar as apostas: um envio em andamento segura FOR SHARE nesta
    -- linha, entao esta contagem espera o commit dele e passa a ver a aposta recem-registrada.
    -- Sem isso, reagendar uma pergunta recem-respondida mudaria a data da aposta ja liquidada.
    PERFORM 1 FROM wager_questions WHERE id = p_id FOR UPDATE;
    IF NOT FOUND THEN
      RETURN jsonb_build_object('success', false, 'reason', 'not_found');
    END IF;
    SELECT count(*) INTO v_entries FROM wager_entries WHERE question_id = p_id;
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

  -- Trava compartilhada na pergunta antes de liquidar: um reagendamento concorrente so trava a
  -- linha no UPDATE, entao sem esta trava ele pode mover scheduled_date entre a leitura e a
  -- gravacao da aposta, e a aposta de hoje passaria a contar como participacao de amanha.
  SELECT * INTO v_q FROM public.wager_questions
  WHERE id = p_question_id
  FOR SHARE;

  IF v_q.id IS NULL OR NOT v_q.is_active OR v_q.scheduled_date <> v_today THEN
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
REVOKE ALL ON FUNCTION public.submit_daily_wager(uuid, text, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_daily_wager(uuid, text, integer) TO authenticated, service_role;
