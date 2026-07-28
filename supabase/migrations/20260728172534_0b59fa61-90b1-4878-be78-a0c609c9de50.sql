-- =========================================================
-- Trilha Tipo Tabuleiro (Board Game Path)
-- =========================================================

CREATE TABLE public.board_trails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','archived')),
  max_moves_per_day INTEGER NOT NULL DEFAULT 3 CHECK (max_moves_per_day BETWEEN 1 AND 20),
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.board_trails TO authenticated;
GRANT ALL ON public.board_trails TO service_role;
ALTER TABLE public.board_trails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "board_trails_select_active" ON public.board_trails
  FOR SELECT TO authenticated
  USING (status = 'active' OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "board_trails_manage" ON public.board_trails
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- ---------------------------------------------------------

CREATE TABLE public.board_tiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trail_id UUID NOT NULL REFERENCES public.board_trails(id) ON DELETE CASCADE,
  position INTEGER NOT NULL CHECK (position >= 0 AND position < 100),
  tile_type TEXT NOT NULL DEFAULT 'neutral'
    CHECK (tile_type IN ('start','bonus','penalty','challenge','neutral','checkpoint','finish')),
  label TEXT NOT NULL DEFAULT 'Casa',
  coins INTEGER NOT NULL DEFAULT 0 CHECK (coins >= 0 AND coins <= 500),
  xp INTEGER NOT NULL DEFAULT 0 CHECK (xp >= 0 AND xp <= 800),
  move_by INTEGER NOT NULL DEFAULT 0 CHECK (move_by BETWEEN -20 AND 20),
  challenge_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (trail_id, position)
);

CREATE INDEX idx_board_tiles_trail ON public.board_tiles(trail_id, position);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.board_tiles TO authenticated;
GRANT ALL ON public.board_tiles TO service_role;
ALTER TABLE public.board_tiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "board_tiles_select" ON public.board_tiles
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.board_trails t
    WHERE t.id = board_tiles.trail_id
      AND (t.status = 'active' OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  ));

CREATE POLICY "board_tiles_manage" ON public.board_tiles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- ---------------------------------------------------------

CREATE TABLE public.board_player_states (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trail_id UUID NOT NULL REFERENCES public.board_trails(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  position INTEGER NOT NULL DEFAULT 0 CHECK (position >= 0),
  coins INTEGER NOT NULL DEFAULT 0 CHECK (coins >= 0),
  xp INTEGER NOT NULL DEFAULT 0 CHECK (xp >= 0),
  checkpoints INTEGER[] NOT NULL DEFAULT '{}',
  moves_count INTEGER NOT NULL DEFAULT 0 CHECK (moves_count >= 0),
  blocked_challenge_id UUID,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (trail_id, user_id)
);

CREATE INDEX idx_board_player_states_user ON public.board_player_states(user_id);

GRANT SELECT, INSERT, UPDATE ON public.board_player_states TO authenticated;
GRANT ALL ON public.board_player_states TO service_role;
ALTER TABLE public.board_player_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "board_states_select_own" ON public.board_player_states
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- ---------------------------------------------------------

CREATE TABLE public.board_moves (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trail_id UUID NOT NULL REFERENCES public.board_trails(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  move_index INTEGER NOT NULL CHECK (move_index >= 0),
  dedupe_key TEXT NOT NULL UNIQUE,
  roll INTEGER NOT NULL CHECK (roll BETWEEN 1 AND 20),
  from_position INTEGER NOT NULL,
  landed_position INTEGER NOT NULL,
  final_position INTEGER NOT NULL,
  tile_type TEXT,
  coins_delta INTEGER NOT NULL DEFAULT 0,
  xp_delta INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_board_moves_user_trail ON public.board_moves(trail_id, user_id, created_at DESC);

GRANT SELECT ON public.board_moves TO authenticated;
GRANT ALL ON public.board_moves TO service_role;
ALTER TABLE public.board_moves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "board_moves_select_own" ON public.board_moves
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- ---------------------------------------------------------
-- Triggers de updated_at
-- ---------------------------------------------------------
CREATE TRIGGER update_board_trails_updated_at BEFORE UPDATE ON public.board_trails
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_board_tiles_updated_at BEFORE UPDATE ON public.board_tiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_board_player_states_updated_at BEFORE UPDATE ON public.board_player_states
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- RPC: avanço idempotente e server-side
-- =========================================================
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

  -- Replay idempotente: devolve o resultado já registrado.
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

  -- Crédito real na carteira do jogador
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