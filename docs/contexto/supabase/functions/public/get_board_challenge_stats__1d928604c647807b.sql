CREATE OR REPLACE FUNCTION public.get_board_challenge_stats(p_trail_id uuid)
 RETURNS TABLE(challenge_id uuid, question text, tile_position integer, attempts integer, correct_attempts integer, accuracy numeric, distinct_players integer, blocked_players integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager')) THEN
    RAISE EXCEPTION 'Acesso restrito a gestores e administradores';
  END IF;

  RETURN QUERY
  SELECT
    t.challenge_id,
    COALESCE(q.question, 'Pergunta removida') AS question,
    t.position AS tile_position,
    COALESCE(m.attempts, 0)::int AS attempts,
    COALESCE(m.correct_attempts, 0)::int AS correct_attempts,
    CASE WHEN COALESCE(m.attempts, 0) = 0 THEN 0
         ELSE ROUND((COALESCE(m.correct_attempts, 0)::numeric / m.attempts) * 100, 1)
    END AS accuracy,
    COALESCE(m.distinct_players, 0)::int AS distinct_players,
    COALESCE(b.blocked_players, 0)::int AS blocked_players
  FROM public.board_tiles t
  LEFT JOIN public.quiz_questions q ON q.id = t.challenge_id
  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS attempts,
           COUNT(*) FILTER (WHERE mv.challenge_correct) AS correct_attempts,
           COUNT(DISTINCT mv.user_id) AS distinct_players
    FROM public.board_moves mv
    WHERE mv.trail_id = t.trail_id
      AND mv.tile_type = 'challenge'
      AND mv.landed_position = t.position
  ) m ON TRUE
  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS blocked_players
    FROM public.board_player_states s
    WHERE s.trail_id = t.trail_id
      AND s.blocked_challenge_id = t.challenge_id
  ) b ON TRUE
  WHERE t.trail_id = p_trail_id
    AND t.tile_type = 'challenge'
    AND t.challenge_id IS NOT NULL
  ORDER BY t.position;
END;
$function$
