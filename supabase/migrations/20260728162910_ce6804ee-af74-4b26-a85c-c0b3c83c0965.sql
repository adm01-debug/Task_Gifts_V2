-- =========================================================
-- Pergunta do Dia com Aposta (Wager)
-- =========================================================

CREATE TABLE public.wager_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  options jsonb NOT NULL,
  correct_option text NOT NULL,
  explanation text,
  difficulty text NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy','medium','hard')),
  base_multiplier numeric(4,2) NOT NULL DEFAULT 2.00 CHECK (base_multiplier >= 1.10 AND base_multiplier <= 5.00),
  max_stake integer NOT NULL DEFAULT 100 CHECK (max_stake >= 10 AND max_stake <= 1000),
  scheduled_date date NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uq_wager_questions_date_active
  ON public.wager_questions (scheduled_date) WHERE is_active;

CREATE TABLE public.wager_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.wager_questions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  stake_coins integer NOT NULL CHECK (stake_coins > 0),
  chosen_option text NOT NULL,
  is_correct boolean NOT NULL,
  multiplier numeric(4,2) NOT NULL,
  coins_delta integer NOT NULL,
  xp_awarded integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (question_id, user_id)
);

CREATE INDEX idx_wager_entries_user_date ON public.wager_entries (user_id, created_at DESC);
CREATE INDEX idx_wager_entries_question ON public.wager_entries (question_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.wager_questions TO authenticated;
GRANT ALL ON public.wager_questions TO service_role;
GRANT SELECT ON public.wager_entries TO authenticated;
GRANT ALL ON public.wager_entries TO service_role;

ALTER TABLE public.wager_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wager_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wager_questions_read_active" ON public.wager_questions
  FOR SELECT TO authenticated
  USING (is_active OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "wager_questions_manage" ON public.wager_questions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "wager_entries_read_own" ON public.wager_entries
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE TRIGGER update_wager_questions_updated_at
  BEFORE UPDATE ON public.wager_questions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------
-- Pergunta do dia (nunca revela a resposta antes da aposta)
-- ---------------------------------------------------------
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

  IF v_q.id IS NULL THEN
    RETURN jsonb_build_object('success', true, 'question', NULL, 'balance', COALESCE(v_balance, 0));
  END IF;

  SELECT * INTO v_entry FROM public.wager_entries
  WHERE question_id = v_q.id AND user_id = v_user;
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

-- ---------------------------------------------------------
-- Envio da aposta (atômico, validado no servidor)
-- ---------------------------------------------------------
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

GRANT EXECUTE ON FUNCTION public.get_daily_wager() TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_daily_wager(uuid, text, integer) TO authenticated;