-- ============================================================
-- TABULEIRO (Trilha Tabuleiro): cria 5 RPCs
-- Tabelas board_trails, board_tiles, board_player_states, board_moves ja existem.
-- 1 trilha + 15 tiles ja estao inseridos.
-- Cole este arquivo no SQL Editor do Supabase.
-- ============================================================

ALTER TABLE public.board_player_states
  ADD COLUMN IF NOT EXISTS challenge_attempts INTEGER NOT NULL DEFAULT 0
    CHECK (challenge_attempts >= 0);

ALTER TABLE public.board_moves
  ADD COLUMN IF NOT EXISTS challenge_correct BOOLEAN;

-- ── advance_board_trail ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.advance_board_trail(
  p_trail_id UUID,
  p_dedupe_key TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_trail public.board_trails%ROWTYPE;
  v_state public.board_player_states%ROWTYPE;
  v_last_position INTEGER;
  v_roll INTEGER;
  v_landed INTEGER;
  v_final INTEGER;
  v_tile public.board_tiles%ROWTYPE;
  v_final_tile public.board_tiles%ROWTYPE;
  v_coins INTEGER := 0;
  v_xp INTEGER := 0;
  v_today_moves INTEGER;
  v_existing public.board_moves%ROWTYPE;
  v_checkpoints INTEGER[];
  v_finished BOOLEAN := false;
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
      'roll', v_existing.roll,
      'from_position', v_existing.from_position,
      'landed_position', v_existing.landed_position,
      'final_position', v_existing.final_position,
      'coins_delta', v_existing.coins_delta,
      'xp_delta', v_existing.xp_delta,
      'position', COALESCE(v_state.position, v_existing.final_position),
      'finished', v_state.finished_at IS NOT NULL
    );
  END IF;

  SELECT * INTO v_trail FROM public.board_trails WHERE id = p_trail_id AND status = 'active';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Trilha indisponível';
  END IF;

  SELECT max(position) INTO v_last_position FROM public.board_tiles WHERE trail_id = p_trail_id;
  IF v_last_position IS NULL OR v_last_position < 4 THEN
    RAISE EXCEPTION 'Tabuleiro incompleto';
  END IF;

  INSERT INTO public.board_player_states (trail_id, user_id)
  VALUES (p_trail_id, v_user)
  ON CONFLICT (trail_id, user_id) DO NOTHING;

  SELECT * INTO v_state FROM public.board_player_states
  WHERE trail_id = p_trail_id AND user_id = v_user
  FOR UPDATE;

  IF v_state.finished_at IS NOT NULL THEN
    RAISE EXCEPTION 'Trilha já concluída';
  END IF;

  IF v_state.blocked_challenge_id IS NOT NULL THEN
    RAISE EXCEPTION 'Conclua o desafio da casa atual para avançar';
  END IF;

  SELECT count(*) INTO v_today_moves FROM public.board_moves
  WHERE trail_id = p_trail_id AND user_id = v_user AND created_at >= date_trunc('day', now());
  IF v_today_moves >= v_trail.max_moves_per_day THEN
    RAISE EXCEPTION 'Limite diário de jogadas atingido';
  END IF;

  v_roll := 1 + floor(random() * 6)::int;
  v_landed := LEAST(v_state.position + v_roll, v_last_position);

  SELECT * INTO v_tile FROM public.board_tiles WHERE trail_id = p_trail_id AND position = v_landed;

  IF v_tile.tile_type = 'challenge' AND v_tile.challenge_id IS NOT NULL THEN
    UPDATE public.board_player_states
      SET position = v_landed, moves_count = moves_count + 1, blocked_challenge_id = v_tile.challenge_id
      WHERE id = v_state.id;

    INSERT INTO public.board_moves (trail_id, user_id, move_index, dedupe_key, roll,
      from_position, landed_position, final_position, tile_type, coins_delta, xp_delta)
    VALUES (p_trail_id, v_user, v_state.moves_count, p_dedupe_key, v_roll,
      v_state.position, v_landed, v_landed, v_tile.tile_type, 0, 0);

    RETURN jsonb_build_object('replayed', false, 'roll', v_roll,
      'from_position', v_state.position, 'landed_position', v_landed,
      'final_position', v_landed, 'coins_delta', 0, 'xp_delta', 0,
      'position', v_landed, 'finished', false,
      'blocked_challenge_id', v_tile.challenge_id);
  END IF;

  IF v_tile.tile_type = 'penalty' THEN
    v_coins := -LEAST(COALESCE(v_tile.coins, 0), v_state.coins);
    v_xp := -LEAST(COALESCE(v_tile.xp, 0), v_state.xp);
  ELSIF v_tile.tile_type IN ('bonus','checkpoint','finish') THEN
    v_coins := COALESCE(v_tile.coins, 0);
    v_xp := COALESCE(v_tile.xp, 0);
  END IF;

  v_final := GREATEST(0, LEAST(v_landed + COALESCE(v_tile.move_by, 0), v_last_position));
  SELECT * INTO v_final_tile FROM public.board_tiles WHERE trail_id = p_trail_id AND position = v_final;
  v_finished := (v_tile.tile_type = 'finish') OR (v_final_tile.tile_type = 'finish');

  v_checkpoints := v_state.checkpoints;
  IF v_tile.tile_type = 'checkpoint' AND NOT (v_landed = ANY(v_checkpoints)) THEN
    v_checkpoints := array_append(v_checkpoints, v_landed);
  END IF;
  IF v_final_tile.tile_type = 'checkpoint' AND NOT (v_final = ANY(v_checkpoints)) THEN
    v_checkpoints := array_append(v_checkpoints, v_final);
  END IF;

  UPDATE public.board_player_states
    SET position = v_final,
        coins = GREATEST(0, coins + v_coins),
        xp = GREATEST(0, xp + v_xp),
        checkpoints = v_checkpoints,
        moves_count = moves_count + 1,
        finished_at = CASE WHEN v_finished THEN now() ELSE finished_at END
    WHERE id = v_state.id;

  INSERT INTO public.board_moves (trail_id, user_id, move_index, dedupe_key, roll,
    from_position, landed_position, final_position, tile_type, coins_delta, xp_delta)
  VALUES (p_trail_id, v_user, v_state.moves_count, p_dedupe_key, v_roll,
    v_state.position, v_landed, v_final, v_tile.tile_type, v_coins, v_xp);

  IF v_coins <> 0 OR v_xp <> 0 THEN
    UPDATE public.profiles
      SET coins = GREATEST(0, COALESCE(coins, 0) + v_coins),
          xp = GREATEST(0, COALESCE(xp, 0) + v_xp)
      WHERE id = v_user;
  END IF;

  RETURN jsonb_build_object('replayed', false, 'roll', v_roll,
    'from_position', v_state.position, 'landed_position', v_landed,
    'final_position', v_final, 'coins_delta', v_coins, 'xp_delta', v_xp,
    'position', v_final, 'finished', v_finished, 'blocked_challenge_id', NULL);
END;
$$;

REVOKE ALL ON FUNCTION public.advance_board_trail(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.advance_board_trail(UUID, TEXT) TO authenticated;

-- ── resolve_board_challenge ──────────────────────────────────
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
  IF v_user IS NULL THEN RAISE EXCEPTION 'Autenticação obrigatória'; END IF;
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
  WHERE trail_id = p_trail_id AND user_id = v_user FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Progresso inexistente nesta trilha'; END IF;
  IF v_state.blocked_challenge_id IS NULL THEN RAISE EXCEPTION 'Nenhum desafio pendente'; END IF;

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
    from_position, landed_position, final_position, tile_type, coins_delta, xp_delta, challenge_correct)
  VALUES (p_trail_id, v_user, v_state.moves_count, p_dedupe_key, 1,
    v_state.position, v_state.position, v_state.position, 'challenge', v_coins, v_xp, v_is_correct);

  IF v_coins <> 0 OR v_xp <> 0 THEN
    UPDATE public.profiles
      SET coins = GREATEST(0, COALESCE(coins, 0) + v_coins),
          xp = GREATEST(0, COALESCE(xp, 0) + v_xp)
      WHERE id = v_user;
  END IF;

  RETURN jsonb_build_object(
    'replayed', false, 'correct', v_is_correct,
    'coins_delta', v_coins, 'xp_delta', v_xp,
    'unblocked', v_unblocked,
    'attempts_left', GREATEST(0, v_max_attempts - v_attempt)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.resolve_board_challenge(UUID, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_board_challenge(UUID, UUID, TEXT) TO authenticated;

-- ── get_board_trail_leaderboard ──────────────────────────────
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
SET search_path = public
AS $$
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
$$;

REVOKE ALL ON FUNCTION public.get_board_trail_leaderboard(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_board_trail_leaderboard(uuid, integer) TO authenticated;

-- ── get_board_challenge_stats ────────────────────────────────
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
SET search_path = public
AS $$
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
$$;

REVOKE ALL ON FUNCTION public.get_board_challenge_stats(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_board_challenge_stats(uuid) TO authenticated;

-- ── save_board_trail ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.save_board_trail(
  p_trail_id uuid,
  p_title text,
  p_description text,
  p_department_id uuid,
  p_status text,
  p_max_moves_per_day integer,
  p_tiles jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trail_id uuid;
  v_count integer;
  v_tile jsonb;
  v_index integer := 0;
  v_starts integer := 0;
  v_finishes integer := 0;
  v_type text;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin'::app_role)
          OR public.has_role(auth.uid(), 'manager'::app_role)) THEN
    RAISE EXCEPTION 'Permissao negada' USING ERRCODE = '42501';
  END IF;

  IF coalesce(btrim(p_title), '') = '' THEN
    RAISE EXCEPTION 'Titulo obrigatorio' USING ERRCODE = '22023';
  END IF;

  IF p_status NOT IN ('draft', 'active', 'archived') THEN
    RAISE EXCEPTION 'Status invalido' USING ERRCODE = '22023';
  END IF;

  IF p_max_moves_per_day IS NULL OR p_max_moves_per_day < 1 OR p_max_moves_per_day > 20 THEN
    RAISE EXCEPTION 'Jogadas por dia devem ficar entre 1 e 20' USING ERRCODE = '22023';
  END IF;

  IF jsonb_typeof(p_tiles) <> 'array' THEN
    RAISE EXCEPTION 'Tabuleiro invalido' USING ERRCODE = '22023';
  END IF;

  v_count := jsonb_array_length(p_tiles);
  IF v_count < 5 OR v_count > 100 THEN
    RAISE EXCEPTION 'O tabuleiro precisa ter entre 5 e 100 casas' USING ERRCODE = '22023';
  END IF;

  FOR v_tile IN SELECT * FROM jsonb_array_elements(p_tiles) LOOP
    v_type := v_tile->>'tile_type';
    IF v_type NOT IN ('start','bonus','penalty','challenge','neutral','checkpoint','finish') THEN
      RAISE EXCEPTION 'Tipo de casa invalido: %', v_type USING ERRCODE = '22023';
    END IF;
    IF v_type = 'start' THEN
      v_starts := v_starts + 1;
      IF v_index <> 0 THEN RAISE EXCEPTION 'A casa de Partida deve ser a primeira' USING ERRCODE = '22023'; END IF;
    END IF;
    IF v_type = 'finish' THEN
      v_finishes := v_finishes + 1;
      IF v_index <> v_count - 1 THEN RAISE EXCEPTION 'A casa de Chegada deve ser a ultima' USING ERRCODE = '22023'; END IF;
    END IF;
    v_index := v_index + 1;
  END LOOP;

  IF v_starts <> 1 THEN RAISE EXCEPTION 'A trilha deve ter exatamente uma casa de Partida' USING ERRCODE = '22023'; END IF;
  IF v_finishes <> 1 THEN RAISE EXCEPTION 'A trilha deve ter exatamente uma casa de Chegada' USING ERRCODE = '22023'; END IF;

  IF p_trail_id IS NULL THEN
    INSERT INTO public.board_trails (title, description, department_id, status, max_moves_per_day)
    VALUES (btrim(p_title), nullif(btrim(coalesce(p_description, '')), ''), p_department_id,
            p_status, p_max_moves_per_day)
    RETURNING id INTO v_trail_id;
  ELSE
    UPDATE public.board_trails
       SET title = btrim(p_title),
           description = nullif(btrim(coalesce(p_description, '')), ''),
           department_id = p_department_id,
           status = p_status,
           max_moves_per_day = p_max_moves_per_day,
           updated_at = now()
     WHERE id = p_trail_id
    RETURNING id INTO v_trail_id;
    IF v_trail_id IS NULL THEN RAISE EXCEPTION 'Trilha nao encontrada' USING ERRCODE = 'P0002'; END IF;
  END IF;

  DELETE FROM public.board_tiles WHERE trail_id = v_trail_id;

  INSERT INTO public.board_tiles (trail_id, position, tile_type, label, coins, xp, move_by, challenge_id)
  SELECT v_trail_id,
         (ord - 1)::integer,
         t->>'tile_type',
         coalesce(nullif(btrim(coalesce(t->>'label', '')), ''), 'Casa ' || (ord - 1)),
         nullif((t->>'coins')::integer, 0),
         nullif((t->>'xp')::integer, 0),
         nullif((t->>'move_by')::integer, 0),
         nullif(btrim(coalesce(t->>'challenge_id', '')), '')
    FROM jsonb_array_elements(p_tiles) WITH ORDINALITY AS a(t, ord);

  RETURN v_trail_id;
END;
$$;

REVOKE ALL ON FUNCTION public.save_board_trail(uuid, text, text, uuid, text, integer, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_board_trail(uuid, text, text, uuid, text, integer, jsonb) TO authenticated;