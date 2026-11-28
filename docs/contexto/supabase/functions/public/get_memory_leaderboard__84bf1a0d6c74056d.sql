CREATE OR REPLACE FUNCTION public.get_memory_leaderboard(p_deck_id uuid DEFAULT NULL::uuid, p_days integer DEFAULT 7, p_limit integer DEFAULT 20)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user UUID := auth.uid();
  v_since TIMESTAMPTZ := now() - make_interval(days => GREATEST(1, p_days));
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;

  RETURN COALESCE((
    SELECT jsonb_agg(row ORDER BY row->>'rank')
    FROM (
      SELECT jsonb_build_object(
        'user_id', s.user_id,
        'display_name', COALESCE(p.display_name, split_part(p.email, '@', 1)),
        'avatar_url', p.avatar_url,
        'deck_id', s.deck_id,
        'matched_pairs', s.matched_pairs,
        'pairs_total', s.pairs_total,
        'moves', s.moves,
        'duration_ms', s.duration_ms,
        'coins_awarded', s.coins_awarded,
        'played_at', s.finished_at,
        'rank', row_number() OVER (ORDER BY s.matched_pairs DESC, s.duration_ms ASC)
      ) AS row
      FROM public.memory_sessions s
      JOIN public.profiles p ON p.id = s.user_id
     WHERE s.status = 'finished'
       AND s.finished_at >= v_since
       AND (p_deck_id IS NULL OR s.deck_id = p_deck_id)
     ORDER BY s.matched_pairs DESC, s.duration_ms ASC
     LIMIT LEAST(100, GREATEST(1, p_limit))
    ) sub
  ), '[]'::jsonb);
END;
$function$
