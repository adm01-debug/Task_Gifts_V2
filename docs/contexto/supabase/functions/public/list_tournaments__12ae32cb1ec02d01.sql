CREATE OR REPLACE FUNCTION public.list_tournaments()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;
  RETURN COALESCE((
    SELECT jsonb_agg(jsonb_build_object(
             'id', t.id, 'title', t.title, 'description', t.description,
             'status', t.status, 'max_participants', t.max_participants,
             'bracket_size', t.bracket_size, 'rounds', t.rounds,
             'registration_closes_at', t.registration_closes_at,
             'coins_per_win', t.coins_per_win, 'xp_per_win', t.xp_per_win,
             'coins_champion', t.coins_champion, 'xp_champion', t.xp_champion,
             'coins_runner_up', t.coins_runner_up, 'xp_runner_up', t.xp_runner_up,
             'participants', (SELECT count(*) FROM public.tournament_participants tp
                               WHERE tp.tournament_id = t.id),
             'joined', EXISTS (SELECT 1 FROM public.tournament_participants tp
                                WHERE tp.tournament_id = t.id AND tp.user_id = auth.uid())
           ) ORDER BY
             CASE t.status WHEN 'running' THEN 0 WHEN 'registration' THEN 1
                           WHEN 'finished' THEN 2 ELSE 3 END,
             t.created_at DESC)
      FROM public.tournaments t
     WHERE t.status <> 'draft' OR public.has_role(auth.uid(), 'admin')
  ), '[]'::jsonb);
END;
$function$
