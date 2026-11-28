CREATE OR REPLACE FUNCTION public.tournament_place_winner(p_tournament_id uuid, p_round integer, p_slot integer, p_winner uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_rounds INTEGER;
  v_next_slot INTEGER := p_slot / 2;
  v_next public.tournament_matches%ROWTYPE;
BEGIN
  SELECT rounds INTO v_rounds FROM public.tournaments WHERE id = p_tournament_id;
  IF p_round >= v_rounds THEN RETURN; END IF;

  IF p_slot % 2 = 0 THEN
    UPDATE public.tournament_matches
       SET home_participant_id = p_winner
     WHERE tournament_id = p_tournament_id AND round = p_round + 1 AND slot = v_next_slot;
  ELSE
    UPDATE public.tournament_matches
       SET away_participant_id = p_winner
     WHERE tournament_id = p_tournament_id AND round = p_round + 1 AND slot = v_next_slot;
  END IF;

  SELECT * INTO v_next FROM public.tournament_matches
   WHERE tournament_id = p_tournament_id AND round = p_round + 1 AND slot = v_next_slot;

  IF v_next.id IS NOT NULL AND v_next.status = 'pending' THEN
    IF v_next.home_participant_id IS NOT NULL AND v_next.away_participant_id IS NOT NULL THEN
      UPDATE public.tournament_matches SET status = 'ready' WHERE id = v_next.id;
    END IF;
  END IF;
END;
$function$
