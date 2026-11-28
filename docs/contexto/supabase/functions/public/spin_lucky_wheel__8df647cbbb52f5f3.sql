CREATE OR REPLACE FUNCTION public.spin_lucky_wheel(p_dedupe_key text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user UUID := auth.uid();
  v_today DATE := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  v_key TEXT;
  v_existing RECORD;
  v_total_weight BIGINT;
  v_roll BIGINT;
  v_prize RECORD;
  v_acc BIGINT := 0;
  v_new_xp INTEGER;
  v_new_level INTEGER;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  v_key := COALESCE(NULLIF(btrim(p_dedupe_key), ''), 'daily:' || v_user::text || ':' || v_today::text);
  IF length(v_key) > 120 THEN RAISE EXCEPTION 'dedupe_key inválida'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext('lucky_wheel:' || v_user::text));
  SELECT s.*, p.rarity INTO v_existing
    FROM public.lucky_wheel_spins s
    LEFT JOIN public.lucky_wheel_prizes p ON p.id = s.prize_id
   WHERE s.user_id = v_user AND s.dedupe_key = v_key;
  IF FOUND THEN
    RETURN jsonb_build_object('success', true, 'replayed', true,
      'prize_id', v_existing.prize_id, 'prize_label', v_existing.prize_label,
      'prize_type', v_existing.prize_type, 'amount', v_existing.amount,
      'rarity', COALESCE(v_existing.rarity, 'common'));
  END IF;
  IF EXISTS (SELECT 1 FROM public.lucky_wheel_spins WHERE user_id = v_user AND spin_date = v_today) THEN
    RETURN jsonb_build_object('success', false, 'reason', 'already_spun');
  END IF;
  SELECT COALESCE(sum(weight), 0) INTO v_total_weight FROM public.lucky_wheel_prizes WHERE is_active;
  IF v_total_weight = 0 THEN RETURN jsonb_build_object('success', false, 'reason', 'no_prizes'); END IF;
  v_roll := floor(random() * v_total_weight)::bigint;
  FOR v_prize IN SELECT * FROM public.lucky_wheel_prizes WHERE is_active ORDER BY created_at, id
  LOOP v_acc := v_acc + v_prize.weight; EXIT WHEN v_roll < v_acc; END LOOP;
  INSERT INTO public.lucky_wheel_spins (user_id, prize_id, prize_label, prize_type, amount, spin_date, dedupe_key)
  VALUES (v_user, v_prize.id, v_prize.label, v_prize.prize_type, v_prize.amount, v_today, v_key);
  IF v_prize.prize_type = 'coins' AND v_prize.amount > 0 THEN
    UPDATE public.profiles SET coins = coins + v_prize.amount WHERE id = v_user;
  ELSIF v_prize.prize_type = 'xp' AND v_prize.amount > 0 THEN
    UPDATE public.profiles SET xp = xp + v_prize.amount,
      level = GREATEST(level, floor((xp + v_prize.amount) / 1000) + 1)
     WHERE id = v_user RETURNING xp, level INTO v_new_xp, v_new_level;
  ELSIF v_prize.prize_type = 'achievement' AND v_prize.achievement_id IS NOT NULL THEN
    INSERT INTO public.user_achievements (user_id, achievement_id)
    VALUES (v_user, v_prize.achievement_id) ON CONFLICT DO NOTHING;
  END IF;
  RETURN jsonb_build_object('success', true, 'replayed', false,
    'prize_id', v_prize.id, 'prize_label', v_prize.label,
    'prize_type', v_prize.prize_type, 'amount', v_prize.amount,
    'rarity', v_prize.rarity, 'new_xp', v_new_xp, 'new_level', v_new_level);
EXCEPTION WHEN unique_violation THEN
  RETURN jsonb_build_object('success', false, 'reason', 'already_spun');
END; $function$
