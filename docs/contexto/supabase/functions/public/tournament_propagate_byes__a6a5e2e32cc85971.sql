CREATE OR REPLACE FUNCTION public.tournament_propagate_byes(p_tournament_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE m RECORD; v_winner UUID;
BEGIN
  FOR m IN SELECT * FROM public.tournament_matches WHERE tournament_id = p_tournament_id AND status = 'bye' AND winner_participant_id IS NULL ORDER BY round, slot LOOP
    v_winner := COALESCE(m.home_participant_id, m.away_participant_id);
    IF v_winner IS NULL THEN CONTINUE; END IF;
    UPDATE public.tournament_matches SET winner_participant_id = v_winner, decided_at = now() WHERE id = m.id;
    PERFORM public.tournament_place_winner(p_tournament_id, m.round, m.slot, v_winner);
  END LOOP;
END;
$function$
