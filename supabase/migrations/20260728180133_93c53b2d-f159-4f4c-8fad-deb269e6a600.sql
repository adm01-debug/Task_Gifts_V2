-- Permite roll = 0 como marcador de evento de sistema (não é uma jogada real).
ALTER TABLE public.board_moves DROP CONSTRAINT IF EXISTS board_moves_roll_check;
ALTER TABLE public.board_moves
  ADD CONSTRAINT board_moves_roll_check CHECK (roll >= 0 AND roll <= 20);

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
  v_rec record;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem executar o desbloqueio';
  END IF;

  CREATE TEMP TABLE IF NOT EXISTS _unblocked_board_players (
    state_id uuid,
    trail_id uuid,
    trail_title text,
    user_id uuid,
    display_name text,
    "position" integer,
    blocked_hours numeric,
    challenge_id uuid
  ) ON COMMIT DROP;
  DELETE FROM _unblocked_board_players;

  INSERT INTO _unblocked_board_players
  SELECT s.id,
         s.trail_id,
         t.title,
         s.user_id,
         COALESCE(p.display_name, 'Colaborador'),
         s.position,
         ROUND((EXTRACT(EPOCH FROM (now() - s.blocked_at)) / 3600.0)::numeric, 1),
         s.blocked_challenge_id
    FROM public.board_player_states s
    LEFT JOIN public.board_trails t ON t.id = s.trail_id
    LEFT JOIN public.profiles p ON p.id = s.user_id
   WHERE s.blocked_challenge_id IS NOT NULL
     AND s.blocked_at IS NOT NULL
     AND s.blocked_at < now() - make_interval(hours => v_hours)
     AND (p_trail_id IS NULL OR s.trail_id = p_trail_id)
     FOR UPDATE OF s SKIP LOCKED;

  UPDATE public.board_player_states s
     SET blocked_challenge_id = NULL,
         challenge_attempts = 0,
         updated_at = now()
   WHERE s.id IN (SELECT u.state_id FROM _unblocked_board_players u);

  -- Trilha auditável: roll = 0 marca evento de sistema; posição não muda.
  INSERT INTO public.board_moves (
    trail_id, user_id, move_index, dedupe_key, roll,
    from_position, landed_position, final_position,
    tile_type, coins_delta, xp_delta, challenge_correct
  )
  SELECT u.trail_id,
         u.user_id,
         COALESCE((SELECT MAX(m.move_index) + 1
                     FROM public.board_moves m
                    WHERE m.trail_id = u.trail_id AND m.user_id = u.user_id), 0),
         'board-auto-unblock:' || u.trail_id || ':' || u.user_id || ':'
           || u.challenge_id || ':' || to_char(now(), 'YYYYMMDD'),
         0,
         u.position, u.position, u.position,
         'challenge', 0, 0, false
    FROM _unblocked_board_players u
  ON CONFLICT (dedupe_key) DO NOTHING;

  FOR v_rec IN SELECT * FROM _unblocked_board_players LOOP
    BEGIN
      PERFORM public.enqueue_push(
        v_rec.user_id,
        'board_unblocked',
        'Desafio liberado',
        'Você ficou parado no desafio da trilha "'
          || COALESCE(v_rec.trail_title, 'Tabuleiro')
          || '" e foi liberado. Volte para continuar avançando!',
        'board-unblock-push:' || v_rec.trail_id || ':' || v_rec.user_id || ':'
          || v_rec.challenge_id || ':' || to_char(now(), 'YYYYMMDD'),
        '/tabuleiro',
        jsonb_build_object('trail_id', v_rec.trail_id, 'position', v_rec.position)
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Falha ao notificar desbloqueio (user %): %', v_rec.user_id, SQLERRM;
    END;
  END LOOP;

  RETURN QUERY
  SELECT u.trail_id, u.trail_title, u.user_id, u.display_name, u.position, u.blocked_hours
    FROM _unblocked_board_players u;
END;
$$;

REVOKE ALL ON FUNCTION public.unblock_board_players(integer, uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.unblock_board_players(integer, uuid) TO authenticated, service_role;