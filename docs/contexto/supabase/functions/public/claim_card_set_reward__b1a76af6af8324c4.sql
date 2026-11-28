CREATE OR REPLACE FUNCTION public.claim_card_set_reward(p_set_code text, p_milestone smallint)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user        UUID := auth.uid();
  v_total       INTEGER;
  v_owned       INTEGER;
  v_value       INTEGER;
  v_coins       INTEGER;
  v_xp          INTEGER;
  v_dedupe      TEXT;
  v_existing    public.card_set_claims%ROWTYPE;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '28000';
  END IF;

  IF p_milestone IS NULL OR p_milestone NOT IN (25, 50, 75, 100) THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_milestone');
  END IF;

  IF p_set_code IS NULL OR length(trim(p_set_code)) = 0 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'unknown_set');
  END IF;

  v_dedupe := 'card_set:' || v_user::TEXT || ':' || p_set_code || ':' || p_milestone::TEXT;

  -- Trava por (usuário, conjunto): serializa duplo clique e retries paralelos.
  PERFORM pg_advisory_xact_lock(hashtext('card_set_claim'), hashtext(v_dedupe));

  SELECT * INTO v_existing
  FROM public.card_set_claims
  WHERE user_id = v_user AND set_code = p_set_code AND milestone = p_milestone;

  IF FOUND THEN
    -- Idempotente: devolve o mesmo resultado, sem creditar de novo.
    RETURN jsonb_build_object(
      'success', true,
      'replayed', true,
      'coins', v_existing.coins_awarded,
      'xp', v_existing.xp_awarded
    );
  END IF;

  SELECT
    COUNT(*)::INTEGER,
    COUNT(*) FILTER (WHERE uc.quantity > 0)::INTEGER,
    COALESCE(SUM(public._card_rarity_value(d.rarity)), 0)::INTEGER
  INTO v_total, v_owned, v_value
  FROM public.card_definitions d
  LEFT JOIN public.user_cards uc
    ON uc.card_id = d.id AND uc.user_id = v_user
  WHERE d.is_active AND d.set_code = p_set_code;

  IF v_total IS NULL OR v_total = 0 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'empty_set');
  END IF;

  IF v_owned * 100 < p_milestone * v_total THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_reached');
  END IF;

  SELECT amount INTO v_coins
  FROM public._card_set_milestone_split(v_value * 5)
  WHERE milestone = p_milestone;

  SELECT amount INTO v_xp
  FROM public._card_set_milestone_split(v_value * 3)
  WHERE milestone = p_milestone;

  v_coins := GREATEST(COALESCE(v_coins, 0), 0);
  v_xp    := GREATEST(COALESCE(v_xp, 0), 0);

  INSERT INTO public.card_set_claims
    (user_id, set_code, milestone, coins_awarded, xp_awarded, cards_owned, cards_total, dedupe_key)
  VALUES
    (v_user, p_set_code, p_milestone, v_coins, v_xp, v_owned, v_total, v_dedupe)
  ON CONFLICT (dedupe_key) DO NOTHING;

  IF NOT FOUND THEN
    -- Corrida vencida por outra transação: nada a creditar.
    RETURN jsonb_build_object('success', true, 'replayed', true, 'coins', 0, 'xp', 0);
  END IF;

  UPDATE public.profiles
     SET coins = coins + v_coins,
         xp    = xp + v_xp
   WHERE id = v_user;

  PERFORM public.enqueue_push(
    p_user_id   := v_user,
    p_type      := 'card_set_reward',
    p_title     := 'Marco de coleção conquistado!',
    p_message    := 'Você completou ' || p_milestone::TEXT || '% da coleção ' || p_set_code ||
                    ' e ganhou ' || v_coins::TEXT || ' moedas.',
    p_dedupe_key := v_dedupe,
    p_url        := '/album',
    p_data       := jsonb_build_object('set_code', p_set_code, 'milestone', p_milestone)
  );

  RETURN jsonb_build_object(
    'success', true,
    'replayed', false,
    'coins', v_coins,
    'xp', v_xp,
    'cards_owned', v_owned,
    'cards_total', v_total
  );
END;
$function$
