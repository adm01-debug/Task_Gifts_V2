-- 1) Rastreabilidade explícita da correção do desafio
ALTER TABLE public.board_moves
  ADD COLUMN IF NOT EXISTS challenge_correct BOOLEAN;

COMMENT ON COLUMN public.board_moves.challenge_correct IS
  'TRUE/FALSE apenas para jogadas de resolução de desafio; NULL para jogadas normais de dado.';

CREATE INDEX IF NOT EXISTS idx_board_moves_trail_challenge
  ON public.board_moves (trail_id, tile_type, created_at DESC)
  WHERE tile_type = 'challenge';

CREATE INDEX IF NOT EXISTS idx_board_player_states_trail_rank
  ON public.board_player_states (trail_id, position DESC, xp DESC, coins DESC);

-- 2) RPC de resolução passa a gravar a correção
CREATE OR REPLACE FUNCTION public.resolve_board_challenge(p_trail_id uuid, p_option_id uuid, p_dedupe_key text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user UUID := auth.uid();
  v_state public.board_player_states%ROWTYPE;
  v_tile public.board_tiles%ROWTYPE;
  v_existing public.board_moves%ROWTYPE;
  v_max_attempts CONSTANT INTEGER := 2;
  v_attempt INTEGER;
  v_is_correct BOOLEAN;
  v_question UUID;
  v_factor NUMERIC;
  v_coins INTEGER := 0;
  v_xp INTEGER := 0;
  v_unblocked BOOLEAN;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Autenticação obrigatória';
  END IF;
  IF p_dedupe_key IS NULL OR length(trim(p_dedupe_key)) < 8 THEN
    RAISE EXCEPTION 'Chave de idempotência inválida';
  END IF;

  SELECT * INTO v_existing FROM public.board_moves
  WHERE dedupe_key = p_dedupe_key AND user_id = v_user;
  IF FOUND THEN
    SELECT * INTO v_state FROM public.board_player_states
    WHERE trail_id = p_trail_id AND user_id = v_user;
    RETURN jsonb_build_object(
      'replayed', true,
      'correct', COALESCE(v_existing.challenge_correct, v_existing.coins_delta > 0 OR v_existing.xp_delta > 0),
      'coins_delta', v_existing.coins_delta,
      'xp_delta', v_existing.xp_delta,
      'unblocked', v_state.blocked_challenge_id IS NULL,
      'attempts_left', GREATEST(0, v_max_attempts - COALESCE(v_state.challenge_attempts, 0))
    );
  END IF;

  SELECT * INTO v_state FROM public.board_player_states
  WHERE trail_id = p_trail_id AND user_id = v_user
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Progresso inexistente nesta trilha';
  END IF;
  IF v_state.blocked_challenge_id IS NULL THEN
    RAISE EXCEPTION 'Nenhum desafio pendente';
  END IF;

  SELECT * INTO v_tile FROM public.board_tiles
  WHERE trail_id = p_trail_id
    AND position = v_state.position
    AND tile_type = 'challenge'
    AND challenge_id = v_state.blocked_challenge_id;
  IF NOT FOUND THEN
    UPDATE public.board_player_states
      SET blocked_challenge_id = NULL, challenge_attempts = 0
      WHERE id = v_state.id;
    RETURN jsonb_build_object('replayed', false, 'correct', false, 'coins_delta', 0,
      'xp_delta', 0, 'unblocked', true, 'attempts_left', 0);
  END IF;

  v_attempt := LEAST(COALESCE(v_state.challenge_attempts, 0) + 1, v_max_attempts);

  SELECT o.question_id, o.is_correct INTO v_question, v_is_correct
  FROM public.quiz_options o
  WHERE o.id = p_option_id;
  IF v_question IS NULL OR v_question <> v_tile.challenge_id THEN
    RAISE EXCEPTION 'Alternativa inválida para o desafio';
  END IF;
  v_is_correct := COALESCE(v_is_correct, false);

  IF v_is_correct THEN
    v_factor := CASE WHEN v_attempt = 1 THEN 1 ELSE 0.5 END;
    v_coins := floor(LEAST(abs(COALESCE(v_tile.coins, 0)), 500) * v_factor)::int;
    v_xp := floor(LEAST(abs(COALESCE(v_tile.xp, 0)), 800) * v_factor)::int;
    v_unblocked := true;
  ELSE
    v_unblocked := v_attempt >= v_max_attempts;
  END IF;

  UPDATE public.board_player_states
    SET blocked_challenge_id = CASE WHEN v_unblocked THEN NULL ELSE blocked_challenge_id END,
        challenge_attempts = CASE WHEN v_unblocked THEN 0 ELSE v_attempt END,
        coins = GREATEST(0, coins + v_coins),
        xp = GREATEST(0, xp + v_xp)
    WHERE id = v_state.id;

  INSERT INTO public.board_moves (trail_id, user_id, move_index, dedupe_key, roll,
    from_position, landed_position, final_position, tile_type, coins_delta, xp_delta,
    challenge_correct)
  VALUES (p_trail_id, v_user, v_state.moves_count, p_dedupe_key, 1,
    v_state.position, v_state.position, v_state.position, 'challenge', v_coins, v_xp,
    v_is_correct);

  IF v_coins <> 0 OR v_xp <> 0 THEN
    UPDATE public.profiles
      SET coins = GREATEST(0, COALESCE(coins, 0) + v_coins),
          xp = GREATEST(0, COALESCE(xp, 0) + v_xp)
      WHERE id = v_user;
  END IF;

  RETURN jsonb_build_object(
    'replayed', false,
    'correct', v_is_correct,
    'coins_delta', v_coins,
    'xp_delta', v_xp,
    'unblocked', v_unblocked,
    'attempts_left', GREATEST(0, v_max_attempts - v_attempt)
  );
END;
$function$;

-- 3) Ranking da trilha (visível a qualquer autenticado)
CREATE OR REPLACE FUNCTION public.get_board_trail_leaderboard(p_trail_id uuid, p_limit integer DEFAULT 50)
 RETURNS TABLE (
   rank integer,
   user_id uuid,
   display_name text,
   avatar_url text,
   board_position integer,
   coins integer,
   xp integer,
   moves_count integer,
   finished_at timestamptz
 )
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
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
$function$;

REVOKE ALL ON FUNCTION public.get_board_trail_leaderboard(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_board_trail_leaderboard(uuid, integer) TO authenticated;

-- 4) Relatório de desafios (somente gestor/admin)
CREATE OR REPLACE FUNCTION public.get_board_challenge_stats(p_trail_id uuid)
 RETURNS TABLE (
   challenge_id uuid,
   question text,
   tile_position integer,
   attempts integer,
   correct_attempts integer,
   accuracy numeric,
   distinct_players integer,
   blocked_players integer
 )
 LANGUAGE plpgsql
 STABLE
 SECURITY DEFINER
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
$function$;

REVOKE ALL ON FUNCTION public.get_board_challenge_stats(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_board_challenge_stats(uuid) TO authenticated;