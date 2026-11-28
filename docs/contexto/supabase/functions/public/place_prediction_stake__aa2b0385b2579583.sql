CREATE OR REPLACE FUNCTION public.place_prediction_stake(p_market_id uuid, p_option_id uuid, p_amount integer, p_dedupe_key text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user uuid := auth.uid();
  v_market public.prediction_markets%ROWTYPE;
  v_option public.prediction_options%ROWTYPE;
  v_existing_option uuid; v_user_total integer; v_balance integer; v_stake_id uuid;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'reason', 'unauthenticated'); END IF;
  IF p_dedupe_key IS NOT NULL THEN
    SELECT id INTO v_stake_id FROM public.prediction_stakes
     WHERE market_id = p_market_id AND user_id = v_user AND dedupe_key = p_dedupe_key;
    IF v_stake_id IS NOT NULL THEN RETURN jsonb_build_object('ok', true, 'duplicate', true, 'stake_id', v_stake_id); END IF;
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_market_id::text || v_user::text, 0));
  SELECT * INTO v_market FROM public.prediction_markets WHERE id = p_market_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'reason', 'market_not_found'); END IF;
  IF v_market.status <> 'open' OR now() >= v_market.locks_at THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'market_closed');
  END IF;
  SELECT * INTO v_option FROM public.prediction_options WHERE id = p_option_id AND market_id = p_market_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'reason', 'unknown_option'); END IF;
  IF p_amount IS NULL OR p_amount < 1 THEN RETURN jsonb_build_object('ok', false, 'reason', 'invalid_amount'); END IF;
  IF p_amount < v_market.min_stake THEN RETURN jsonb_build_object('ok', false, 'reason', 'below_minimum'); END IF;
  SELECT option_id INTO v_existing_option FROM public.prediction_stakes WHERE market_id = p_market_id AND user_id = v_user LIMIT 1;
  IF v_existing_option IS NOT NULL AND v_existing_option <> p_option_id THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'option_switch_forbidden');
  END IF;
  SELECT COALESCE(SUM(amount), 0) INTO v_user_total FROM public.prediction_stakes WHERE market_id = p_market_id AND user_id = v_user;
  IF v_market.max_stake_per_user > 0 AND v_user_total + p_amount > v_market.max_stake_per_user THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'over_user_cap');
  END IF;
  SELECT coins INTO v_balance FROM public.profiles WHERE id = v_user FOR UPDATE;
  IF v_balance IS NULL OR v_balance < p_amount THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'insufficient_coins');
  END IF;
  UPDATE public.profiles SET coins = coins - p_amount WHERE id = v_user;
  INSERT INTO public.prediction_stakes (market_id, option_id, user_id, amount, dedupe_key)
  VALUES (p_market_id, p_option_id, v_user, p_amount, p_dedupe_key) RETURNING id INTO v_stake_id;
  UPDATE public.prediction_options SET pool = pool + p_amount WHERE id = p_option_id;
  UPDATE public.prediction_markets SET total_pool = total_pool + p_amount WHERE id = p_market_id;
  RETURN jsonb_build_object('ok', true, 'stake_id', v_stake_id,
    'new_balance', v_balance - p_amount, 'user_total', v_user_total + p_amount);
END; $function$
