CREATE OR REPLACE FUNCTION public.submit_daily_wager(p_question_id uuid, p_option text, p_stake integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
