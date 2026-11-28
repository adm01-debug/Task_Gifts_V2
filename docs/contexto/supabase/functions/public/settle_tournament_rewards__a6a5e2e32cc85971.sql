CREATE OR REPLACE FUNCTION public.settle_tournament_rewards(p_tournament_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_t public.tournaments%ROWTYPE; r RECORD; v_coins INTEGER; v_xp INTEGER; v_total_coins INTEGER := 0; v_total_xp INTEGER := 0; v_paid INTEGER := 0;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('tournament_settle:' || p_tournament_id::text, 0));
  SELECT * INTO v_t FROM public.tournaments WHERE id = p_tournament_id;
  IF NOT FOUND OR v_t.status <> 'finished' THEN RETURN jsonb_build_object('success', false, 'reason', 'not_finished'); END IF;
  FOR r IN SELECT * FROM public.tournament_participants WHERE tournament_id = p_tournament_id AND rewarded_at IS NULL ORDER BY seed FOR UPDATE LOOP
    v_coins := r.wins * v_t.coins_per_win; v_xp := r.wins * v_t.xp_per_win;
    IF r.placement = 'champion' THEN v_coins := v_coins + v_t.coins_champion; v_xp := v_xp + v_t.xp_champion;
    ELSIF r.placement = 'runner_up' THEN v_coins := v_coins + v_t.coins_runner_up; v_xp := v_xp + v_t.xp_runner_up; END IF;
    UPDATE public.tournament_participants SET coins_awarded = v_coins, xp_awarded = v_xp, rewarded_at = now() WHERE id = r.id;
    IF v_coins > 0 OR v_xp > 0 THEN UPDATE public.profiles SET coins = coins + v_coins, xp = xp + v_xp, level = GREATEST(level, floor((xp + v_xp) / 1000) + 1) WHERE id = r.user_id; v_total_coins := v_total_coins + v_coins; v_total_xp := v_total_xp + v_xp; v_paid := v_paid + 1; END IF;
  END LOOP;
  RETURN jsonb_build_object('success', true, 'participants_paid', v_paid, 'coins', v_total_coins, 'xp', v_total_xp);
END;
$function$
