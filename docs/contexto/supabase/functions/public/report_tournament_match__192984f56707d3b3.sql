CREATE OR REPLACE FUNCTION public.report_tournament_match(p_match_id uuid, p_home_score integer, p_away_score integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_m public.tournament_matches%ROWTYPE; v_t public.tournaments%ROWTYPE; v_winner UUID; v_loser UUID; v_home_seed INTEGER; v_away_seed INTEGER;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RETURN jsonb_build_object('success', false, 'reason', 'forbidden'); END IF;
  IF p_home_score IS NULL OR p_away_score IS NULL OR p_home_score < 0 OR p_away_score < 0 OR p_home_score > 1000 OR p_away_score > 1000 THEN RETURN jsonb_build_object('success', false, 'reason', 'invalid_score'); END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('tournament_match:' || p_match_id::text, 0));
  SELECT * INTO v_m FROM public.tournament_matches WHERE id = p_match_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'reason', 'not_found'); END IF;
  IF v_m.status = 'decided' THEN RETURN jsonb_build_object('success', true, 'already_decided', true, 'winner_participant_id', v_m.winner_participant_id); END IF;
  IF v_m.home_participant_id IS NULL OR v_m.away_participant_id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'match_not_ready'); END IF;
  SELECT * INTO v_t FROM public.tournaments WHERE id = v_m.tournament_id;
  IF v_t.status <> 'running' THEN RETURN jsonb_build_object('success', false, 'reason', 'tournament_not_running'); END IF;
  SELECT seed INTO v_home_seed FROM public.tournament_participants WHERE id = v_m.home_participant_id;
  SELECT seed INTO v_away_seed FROM public.tournament_participants WHERE id = v_m.away_participant_id;
  IF p_home_score > p_away_score THEN v_winner := v_m.home_participant_id; v_loser := v_m.away_participant_id;
  ELSIF p_away_score > p_home_score THEN v_winner := v_m.away_participant_id; v_loser := v_m.home_participant_id;
  ELSIF COALESCE(v_home_seed, 999) <= COALESCE(v_away_seed, 999) THEN v_winner := v_m.home_participant_id; v_loser := v_m.away_participant_id;
  ELSE v_winner := v_m.away_participant_id; v_loser := v_m.home_participant_id; END IF;
  UPDATE public.tournament_matches SET home_score = p_home_score, away_score = p_away_score, winner_participant_id = v_winner, status = 'decided', decided_at = now() WHERE id = p_match_id;
  UPDATE public.tournament_participants SET wins = wins + 1 WHERE id = v_winner;
  UPDATE public.tournament_participants SET eliminated_round = v_m.round, placement = 'eliminated' WHERE id = v_loser;
  PERFORM public.tournament_place_winner(v_m.tournament_id, v_m.round, v_m.slot, v_winner);
  IF v_m.round = v_t.rounds THEN UPDATE public.tournament_participants SET placement = 'champion' WHERE id = v_winner; UPDATE public.tournament_participants SET placement = 'runner_up' WHERE id = v_loser; UPDATE public.tournaments SET status = 'finished', finished_at = now(), champion_user_id = (SELECT user_id FROM public.tournament_participants WHERE id = v_winner), runner_up_user_id = (SELECT user_id FROM public.tournament_participants WHERE id = v_loser) WHERE id = v_m.tournament_id; PERFORM public.settle_tournament_rewards(v_m.tournament_id); END IF;
  RETURN jsonb_build_object('success', true, 'winner_participant_id', v_winner, 'finished', v_m.round = v_t.rounds);
END; $function$
