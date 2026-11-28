CREATE OR REPLACE FUNCTION public.start_tournament(p_tournament_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_t public.tournaments%ROWTYPE; v_n INTEGER; v_size INTEGER := 2; v_rounds INTEGER; v_order INTEGER[]; v_slot INTEGER; v_home INTEGER; v_away INTEGER; v_home_id UUID; v_away_id UUID; v_round INTEGER; v_count INTEGER;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RETURN jsonb_build_object('success', false, 'reason', 'forbidden'); END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('tournament_start:' || p_tournament_id::text, 0));
  SELECT * INTO v_t FROM public.tournaments WHERE id = p_tournament_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'reason', 'not_found'); END IF;
  IF v_t.status <> 'registration' THEN RETURN jsonb_build_object('success', false, 'reason', 'invalid_status'); END IF;
  SELECT count(*) INTO v_n FROM public.tournament_participants WHERE tournament_id = p_tournament_id;
  IF v_n < 2 THEN RETURN jsonb_build_object('success', false, 'reason', 'insufficient_participants'); END IF;
  WHILE v_size < v_n LOOP v_size := v_size * 2; END LOOP;
  v_rounds := (ln(v_size) / ln(2))::INTEGER;
  WITH ranked AS (SELECT tp.id, row_number() OVER (ORDER BY COALESCE(p.xp, 0) DESC, COALESCE(p.full_name, '') ASC, tp.user_id ASC) AS rn FROM public.tournament_participants tp LEFT JOIN public.profiles p ON p.id = tp.user_id WHERE tp.tournament_id = p_tournament_id)
  UPDATE public.tournament_participants tp SET seed = ranked.rn, wins = 0, eliminated_round = NULL, placement = NULL FROM ranked WHERE tp.id = ranked.id;
  DELETE FROM public.tournament_matches WHERE tournament_id = p_tournament_id;
  v_order := public.tournament_seed_order(v_size);
  FOR v_slot IN 0 .. (v_size / 2 - 1) LOOP
    v_home := v_order[v_slot * 2 + 1]; v_away := v_order[v_slot * 2 + 2];
    IF v_home > v_n THEN v_home := NULL; END IF; IF v_away > v_n THEN v_away := NULL; END IF;
    SELECT id INTO v_home_id FROM public.tournament_participants WHERE tournament_id = p_tournament_id AND seed = v_home;
    SELECT id INTO v_away_id FROM public.tournament_participants WHERE tournament_id = p_tournament_id AND seed = v_away;
    INSERT INTO public.tournament_matches (tournament_id, round, slot, home_participant_id, away_participant_id, status) VALUES (p_tournament_id, 1, v_slot, v_home_id, v_away_id, CASE WHEN v_home_id IS NULL OR v_away_id IS NULL THEN 'bye' ELSE 'ready' END);
  END LOOP;
  FOR v_round IN 2 .. v_rounds LOOP v_count := v_size / (2 ^ v_round)::INTEGER; FOR v_slot IN 0 .. (v_count - 1) LOOP INSERT INTO public.tournament_matches (tournament_id, round, slot, status) VALUES (p_tournament_id, v_round, v_slot, 'pending'); END LOOP; END LOOP;
  UPDATE public.tournaments SET status = 'running', bracket_size = v_size, rounds = v_rounds, started_at = now(), champion_user_id = NULL, runner_up_user_id = NULL, finished_at = NULL WHERE id = p_tournament_id;
  PERFORM public.tournament_propagate_byes(p_tournament_id);
  RETURN jsonb_build_object('success', true, 'bracket_size', v_size, 'rounds', v_rounds, 'participants', v_n);
END; $function$
