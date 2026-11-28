CREATE OR REPLACE FUNCTION public.settle_boss_battle(_battle_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_battle public.boss_battles%ROWTYPE; v_total INTEGER; v_eligible_total INTEGER; v_distributed_coins INTEGER := 0; v_distributed_xp INTEGER := 0; r RECORD; v_coins INTEGER; v_xp INTEGER;
BEGIN
  PERFORM public._require_manager_or_admin(); PERFORM pg_advisory_xact_lock(hashtextextended(_battle_id::text, 43));
  SELECT * INTO v_battle FROM public.boss_battles WHERE id = _battle_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'battle not found'; END IF;
  IF v_battle.settled_at IS NOT NULL THEN RETURN jsonb_build_object('already_settled', true); END IF;
  SELECT COALESCE(SUM(damage), 0) INTO v_total FROM public.boss_battle_damage WHERE battle_id = _battle_id;
  IF v_total = 0 THEN UPDATE public.boss_battles SET status = 'settled', settled_at = now() WHERE id = _battle_id; RETURN jsonb_build_object('participants', 0, 'coins', 0, 'xp', 0); END IF;
  SELECT COALESCE(SUM(d.total), 0) INTO v_eligible_total FROM (SELECT user_id, SUM(damage) AS total FROM public.boss_battle_damage WHERE battle_id = _battle_id GROUP BY user_id HAVING SUM(damage)::NUMERIC / v_total >= v_battle.min_share AND SUM(damage) > 0) d;
  IF v_eligible_total = 0 THEN UPDATE public.boss_battles SET status = 'settled', settled_at = now() WHERE id = _battle_id; RETURN jsonb_build_object('participants', 0, 'coins', 0, 'xp', 0); END IF;
  FOR r IN SELECT user_id, SUM(damage) AS total FROM public.boss_battle_damage WHERE battle_id = _battle_id GROUP BY user_id HAVING SUM(damage)::NUMERIC / v_total >= v_battle.min_share AND SUM(damage) > 0 ORDER BY SUM(damage) DESC, user_id ASC LOOP
    v_coins := FLOOR(v_battle.coins_pool::NUMERIC * r.total / v_eligible_total)::INTEGER;
    IF v_battle.per_user_coins_cap > 0 THEN v_coins := LEAST(v_coins, v_battle.per_user_coins_cap); END IF;
    v_xp := FLOOR(v_battle.xp_pool::NUMERIC * r.total / v_eligible_total)::INTEGER;
    INSERT INTO public.boss_battle_rewards (battle_id, user_id, damage, share, coins, xp) VALUES (_battle_id, r.user_id, r.total, r.total::NUMERIC / v_eligible_total, v_coins, v_xp) ON CONFLICT (battle_id, user_id) DO NOTHING;
    UPDATE public.profiles SET coins = coins + v_coins, xp = xp + v_xp WHERE id = r.user_id;
    v_distributed_coins := v_distributed_coins + v_coins; v_distributed_xp := v_distributed_xp + v_xp;
  END LOOP;
  UPDATE public.boss_battles SET status = 'settled', settled_at = now() WHERE id = _battle_id;
  RETURN jsonb_build_object('coins', v_distributed_coins, 'xp', v_distributed_xp);
END; $function$
