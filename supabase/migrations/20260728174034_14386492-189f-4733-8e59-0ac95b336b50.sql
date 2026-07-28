ALTER TABLE public.board_player_states
  ADD COLUMN IF NOT EXISTS challenge_attempts INTEGER NOT NULL DEFAULT 0
    CHECK (challenge_attempts >= 0);

CREATE OR REPLACE FUNCTION public.resolve_board_challenge(
  p_trail_id UUID,
  p_option_id UUID,
  p_dedupe_key TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  -- Replay idempotente
  SELECT * INTO v_existing FROM public.board_moves
  WHERE dedupe_key = p_dedupe_key AND user_id = v_user;
  IF FOUND THEN
    SELECT * INTO v_state FROM public.board_player_states
    WHERE trail_id = p_trail_id AND user_id = v_user;
    RETURN jsonb_build_object(
      'replayed', true,
      'correct', v_existing.coins_delta > 0 OR v_existing.xp_delta > 0,
      'coins_delta', v_existing.coins_delta,
      'xp_delta', v_existing.xp_delta,
      'unblocked', COALESCE(v_state.blocked_challenge_id, '00000000-0000-0000-0000-000000000000'::uuid) IS NULL,
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
    -- Casa removida/alterada pelo admin: libera o jogador sem prêmio.
    UPDATE public.board_player_states
      SET blocked_challenge_id = NULL, challenge_attempts = 0
      WHERE id = v_state.id;
    RETURN jsonb_build_object('replayed', false, 'correct', false, 'coins_delta', 0,
      'xp_delta', 0, 'unblocked', true, 'attempts_left', 0);
  END IF;

  v_attempt := LEAST(COALESCE(v_state.challenge_attempts, 0) + 1, v_max_attempts);

  -- Valida a alternativa estritamente contra a pergunta vinculada à casa.
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
    from_position, landed_position, final_position, tile_type, coins_delta, xp_delta)
  VALUES (p_trail_id, v_user, v_state.moves_count, p_dedupe_key, 1,
    v_state.position, v_state.position, v_state.position, 'challenge', v_coins, v_xp);

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
$$;

REVOKE ALL ON FUNCTION public.resolve_board_challenge(UUID, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_board_challenge(UUID, UUID, TEXT) TO authenticated;