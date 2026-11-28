CREATE OR REPLACE FUNCTION public.get_tournament_bracket(p_tournament_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_t public.tournaments%ROWTYPE;
  v_result JSONB;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'unauthenticated');
  END IF;

  SELECT * INTO v_t FROM public.tournaments WHERE id = p_tournament_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_found');
  END IF;
  IF v_t.status = 'draft' AND NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_found');
  END IF;

  SELECT jsonb_build_object(
    'success', true,
    'tournament', to_jsonb(v_t),
    'joined', EXISTS (SELECT 1 FROM public.tournament_participants
                       WHERE tournament_id = p_tournament_id AND user_id = auth.uid()),
    'participants', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
               'id', tp.id, 'user_id', tp.user_id, 'seed', tp.seed,
               'wins', tp.wins, 'placement', tp.placement,
               'eliminated_round', tp.eliminated_round,
               'coins_awarded', tp.coins_awarded, 'xp_awarded', tp.xp_awarded,
               'display_name', COALESCE(p.display_name, 'Colaborador'),
               'avatar_url', p.avatar_url
             ) ORDER BY COALESCE(tp.seed, 999))
        FROM public.tournament_participants tp
        LEFT JOIN public.profiles p ON p.id = tp.user_id
       WHERE tp.tournament_id = p_tournament_id
    ), '[]'::jsonb),
    'matches', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
               'id', m.id, 'round', m.round, 'slot', m.slot,
               'home_participant_id', m.home_participant_id,
               'away_participant_id', m.away_participant_id,
               'home_score', m.home_score, 'away_score', m.away_score,
               'winner_participant_id', m.winner_participant_id,
               'status', m.status
             ) ORDER BY m.round, m.slot)
        FROM public.tournament_matches m
       WHERE m.tournament_id = p_tournament_id
    ), '[]'::jsonb)
  ) INTO v_result;

  RETURN v_result;
END;
$function$
