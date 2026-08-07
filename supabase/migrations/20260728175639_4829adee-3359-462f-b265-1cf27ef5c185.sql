CREATE OR REPLACE FUNCTION public.unblock_board_players(
  p_max_hours integer DEFAULT 48,
  p_trail_id uuid DEFAULT NULL
)
RETURNS TABLE (
  trail_id uuid,
  trail_title text,
  user_id uuid,
  display_name text,
  "position" integer,
  blocked_hours numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_hours integer := GREATEST(1, LEAST(COALESCE(p_max_hours, 48), 720));
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem executar o desbloqueio';
  END IF;

  RETURN QUERY
  WITH stale AS (
    SELECT s.id, s.trail_id, s.user_id, s.position, s.blocked_challenge_id, s.blocked_at
      FROM public.board_player_states s
     WHERE s.blocked_challenge_id IS NOT NULL
       AND s.blocked_at IS NOT NULL
       AND s.blocked_at < now() - make_interval(hours => v_hours)
       AND (p_trail_id IS NULL OR s.trail_id = p_trail_id)
     FOR UPDATE SKIP LOCKED
  ), released AS (
    UPDATE public.board_player_states s
       SET blocked_challenge_id = NULL,
           challenge_attempts = 0,
           updated_at = now()
      FROM stale
     WHERE s.id = stale.id
    RETURNING stale.trail_id AS trail_id,
              stale.user_id AS user_id,
              stale.position AS position,
              stale.blocked_challenge_id AS blocked_challenge_id,
              stale.blocked_at AS blocked_at
  ), logged AS (
    INSERT INTO public.board_moves (
      trail_id, user_id, from_position, to_position, dice,
      tile_type, coins_delta, xp_delta, dedupe_key, challenge_correct
    )
    SELECT r.trail_id, r.user_id, r.position, r.position, 0,
           'challenge', 0, 0,
           'board-auto-unblock:' || r.trail_id || ':' || r.user_id || ':'
             || r.blocked_challenge_id || ':' || to_char(now(), 'YYYYMMDD'),
           false
      FROM released r
    ON CONFLICT (dedupe_key) DO NOTHING
    RETURNING 1
  )
  SELECT r.trail_id,
         t.title,
         r.user_id,
         COALESCE(p.display_name, 'Colaborador'),
         r.position,
         ROUND((EXTRACT(EPOCH FROM (now() - r.blocked_at)) / 3600.0)::numeric, 1)
    FROM released r
    LEFT JOIN public.board_trails t ON t.id = r.trail_id
    LEFT JOIN public.profiles p ON p.id = r.user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.unblock_board_players(integer, uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.unblock_board_players(integer, uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.list_stuck_board_players(
  p_max_hours integer DEFAULT 48,
  p_trail_id uuid DEFAULT NULL
)
RETURNS TABLE (
  trail_id uuid,
  trail_title text,
  user_id uuid,
  display_name text,
  "position" integer,
  blocked_hours numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT s.trail_id,
         t.title,
         s.user_id,
         COALESCE(p.display_name, 'Colaborador'),
         s.position,
         ROUND((EXTRACT(EPOCH FROM (now() - s.blocked_at)) / 3600.0)::numeric, 1)
    FROM public.board_player_states s
    LEFT JOIN public.board_trails t ON t.id = s.trail_id
    LEFT JOIN public.profiles p ON p.id = s.user_id
   WHERE s.blocked_challenge_id IS NOT NULL
     AND s.blocked_at IS NOT NULL
     AND s.blocked_at < now() - make_interval(
           hours => GREATEST(1, LEAST(COALESCE(p_max_hours, 48), 720)))
     AND (p_trail_id IS NULL OR s.trail_id = p_trail_id)
     AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
   ORDER BY s.blocked_at ASC
   LIMIT 200;
$$;

REVOKE ALL ON FUNCTION public.list_stuck_board_players(integer, uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.list_stuck_board_players(integer, uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.auto_unblock_board_players(p_max_hours integer DEFAULT 48)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT count(*)::integer INTO v_count
    FROM public.unblock_board_players(p_max_hours, NULL);
  RETURN COALESCE(v_count, 0);
END;
$$;