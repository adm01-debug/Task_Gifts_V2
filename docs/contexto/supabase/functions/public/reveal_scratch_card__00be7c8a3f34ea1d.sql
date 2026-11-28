CREATE OR REPLACE FUNCTION public.reveal_scratch_card(p_card_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user UUID := auth.uid();
  v_card RECORD;
  v_total BIGINT;
  v_roll BIGINT;
  v_acc BIGINT := 0;
  v_prize RECORD;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext('scratch_card:' || v_user::text));
  SELECT * INTO v_card FROM public.scratch_cards WHERE id = p_card_id AND user_id = v_user FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'reason', 'not_found'); END IF;
  IF v_card.status = 'revealed' THEN
    RETURN jsonb_build_object('success', true, 'replayed', true,
      'prize_label', v_card.prize_label, 'prize_type', v_card.prize_type,
      'amount', v_card.amount, 'rarity', COALESCE(v_card.rarity, 'common'));
  END IF;
  SELECT COALESCE(sum(weight), 0) INTO v_total FROM public.scratch_card_prizes WHERE is_active;
  IF v_total = 0 THEN RETURN jsonb_build_object('success', false, 'reason', 'no_prizes'); END IF;
  v_roll := floor(random() * v_total)::bigint;
  FOR v_prize IN SELECT * FROM public.scratch_card_prizes WHERE is_active ORDER BY created_at, id
  LOOP v_acc := v_acc + v_prize.weight; EXIT WHEN v_roll < v_acc; END LOOP;
  UPDATE public.scratch_cards SET status='revealed', prize_id=v_prize.id, prize_label=v_prize.label,
    prize_type=v_prize.prize_type, amount=v_prize.amount, rarity=v_prize.rarity, revealed_at=now()
   WHERE id = v_card.id AND status = 'pending';
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'reason', 'race'); END IF;
  IF v_prize.prize_type = 'coins' AND v_prize.amount > 0 THEN
    UPDATE public.profiles SET coins = coins + v_prize.amount WHERE id = v_user;
  ELSIF v_prize.prize_type = 'xp' AND v_prize.amount > 0 THEN
    UPDATE public.profiles SET xp = xp + v_prize.amount,
      level = GREATEST(level, floor((xp + v_prize.amount) / 1000) + 1) WHERE id = v_user;
  END IF;
  RETURN jsonb_build_object('success', true, 'replayed', false,
    'prize_id', v_prize.id, 'prize_label', v_prize.label,
    'prize_type', v_prize.prize_type, 'amount', v_prize.amount, 'rarity', v_prize.rarity);
END; $function$
