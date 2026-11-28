CREATE OR REPLACE FUNCTION public.get_daily_wager()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
