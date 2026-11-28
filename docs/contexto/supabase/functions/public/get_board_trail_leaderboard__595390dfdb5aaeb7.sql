CREATE OR REPLACE FUNCTION public.get_board_trail_leaderboard(p_trail_id uuid, p_limit integer DEFAULT 50)
 RETURNS TABLE(rank integer, user_id uuid, display_name text, avatar_url text, board_position integer, coins integer, xp integer, moves_count integer, finished_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    ROW_NUMBER() OVER (
      ORDER BY (s.finished_at IS NULL), s.finished_at ASC NULLS LAST,
               s.position DESC, s.xp DESC, s.coins DESC, s.updated_at ASC
    )::int AS rank,
    s.user_id,
    COALESCE(p.display_name, 'Colaborador') AS display_name,
    p.avatar_url,
    s.position AS board_position,
    s.coins,
    s.xp,
    s.moves_count,
    s.finished_at
  FROM public.board_player_states s
  LEFT JOIN public.profiles p ON p.id = s.user_id
  WHERE s.trail_id = p_trail_id
    AND auth.uid() IS NOT NULL
  ORDER BY rank
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 50), 200));
$function$
