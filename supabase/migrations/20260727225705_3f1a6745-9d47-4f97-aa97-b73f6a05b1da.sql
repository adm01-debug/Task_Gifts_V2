-- ============================================================
-- TORNEIO MATA-MATA (single elimination) — infraestrutura
-- ============================================================

CREATE TABLE public.tournaments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL CHECK (char_length(btrim(title)) BETWEEN 3 AND 120),
  description TEXT CHECK (description IS NULL OR char_length(description) <= 1000),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','registration','running','finished','cancelled')),
  max_participants INTEGER NOT NULL DEFAULT 32
    CHECK (max_participants BETWEEN 2 AND 256),
  bracket_size INTEGER CHECK (bracket_size IS NULL OR bracket_size BETWEEN 2 AND 256),
  rounds INTEGER CHECK (rounds IS NULL OR rounds BETWEEN 1 AND 8),
  registration_opens_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  registration_closes_at TIMESTAMPTZ,
  coins_per_win INTEGER NOT NULL DEFAULT 10 CHECK (coins_per_win BETWEEN 0 AND 500),
  xp_per_win INTEGER NOT NULL DEFAULT 25 CHECK (xp_per_win BETWEEN 0 AND 1000),
  coins_champion INTEGER NOT NULL DEFAULT 150 CHECK (coins_champion BETWEEN 0 AND 5000),
  xp_champion INTEGER NOT NULL DEFAULT 400 CHECK (xp_champion BETWEEN 0 AND 10000),
  coins_runner_up INTEGER NOT NULL DEFAULT 60 CHECK (coins_runner_up BETWEEN 0 AND 5000),
  xp_runner_up INTEGER NOT NULL DEFAULT 150 CHECK (xp_runner_up BETWEEN 0 AND 10000),
  champion_user_id UUID,
  runner_up_user_id UUID,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.tournament_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  seed INTEGER CHECK (seed IS NULL OR seed BETWEEN 1 AND 256),
  wins INTEGER NOT NULL DEFAULT 0 CHECK (wins >= 0),
  eliminated_round INTEGER,
  placement TEXT CHECK (placement IS NULL OR placement IN ('champion','runner_up','eliminated')),
  coins_awarded INTEGER NOT NULL DEFAULT 0 CHECK (coins_awarded >= 0),
  xp_awarded INTEGER NOT NULL DEFAULT 0 CHECK (xp_awarded >= 0),
  rewarded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tournament_id, user_id),
  UNIQUE (tournament_id, seed)
);

CREATE TABLE public.tournament_matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  round INTEGER NOT NULL CHECK (round BETWEEN 1 AND 8),
  slot INTEGER NOT NULL CHECK (slot >= 0),
  home_participant_id UUID REFERENCES public.tournament_participants(id) ON DELETE SET NULL,
  away_participant_id UUID REFERENCES public.tournament_participants(id) ON DELETE SET NULL,
  home_score INTEGER NOT NULL DEFAULT 0 CHECK (home_score >= 0),
  away_score INTEGER NOT NULL DEFAULT 0 CHECK (away_score >= 0),
  winner_participant_id UUID REFERENCES public.tournament_participants(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','ready','decided','bye')),
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tournament_id, round, slot)
);

CREATE INDEX idx_tournaments_status ON public.tournaments(status, registration_opens_at DESC);
CREATE INDEX idx_tournament_participants_tid ON public.tournament_participants(tournament_id, seed);
CREATE INDEX idx_tournament_participants_user ON public.tournament_participants(user_id);
CREATE INDEX idx_tournament_matches_tid ON public.tournament_matches(tournament_id, round, slot);

GRANT SELECT ON public.tournaments TO authenticated;
GRANT ALL ON public.tournaments TO service_role;
GRANT SELECT ON public.tournament_participants TO authenticated;
GRANT ALL ON public.tournament_participants TO service_role;
GRANT SELECT ON public.tournament_matches TO authenticated;
GRANT ALL ON public.tournament_matches TO service_role;

ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Torneios publicados sao visiveis para autenticados"
  ON public.tournaments FOR SELECT TO authenticated
  USING (status <> 'draft' OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins gerenciam torneios"
  ON public.tournaments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Participantes de torneios visiveis para autenticados"
  ON public.tournament_participants FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tournaments t
      WHERE t.id = tournament_id
        AND (t.status <> 'draft' OR public.has_role(auth.uid(), 'admin'))
    )
  );

CREATE POLICY "Partidas visiveis para autenticados"
  ON public.tournament_matches FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tournaments t
      WHERE t.id = tournament_id
        AND (t.status <> 'draft' OR public.has_role(auth.uid(), 'admin'))
    )
  );

CREATE TRIGGER trg_tournaments_updated_at BEFORE UPDATE ON public.tournaments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_tournament_participants_updated_at BEFORE UPDATE ON public.tournament_participants
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_tournament_matches_updated_at BEFORE UPDATE ON public.tournament_matches
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- Ordem canônica de seeds (1 x último, 2 x penúltimo, ...)
-- ============================================================
CREATE OR REPLACE FUNCTION public.tournament_seed_order(p_size INTEGER)
RETURNS INTEGER[]
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  v_order INTEGER[] := ARRAY[1,2];
  v_next INTEGER;
  v_new INTEGER[];
  v_seed INTEGER;
BEGIN
  IF p_size < 2 THEN RETURN ARRAY[]::INTEGER[]; END IF;
  WHILE array_length(v_order,1) < p_size LOOP
    v_next := array_length(v_order,1) * 2;
    v_new := ARRAY[]::INTEGER[];
    FOREACH v_seed IN ARRAY v_order LOOP
      v_new := v_new || v_seed || (v_next + 1 - v_seed);
    END LOOP;
    v_order := v_new;
  END LOOP;
  RETURN v_order;
END;
$$;

-- ============================================================
-- Inscrição no torneio
-- ============================================================
CREATE OR REPLACE FUNCTION public.join_tournament(p_tournament_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_t public.tournaments%ROWTYPE;
  v_count INTEGER;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'unauthenticated');
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended('tournament_join:' || p_tournament_id::text, 0));

  SELECT * INTO v_t FROM public.tournaments WHERE id = p_tournament_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_found');
  END IF;
  IF v_t.status <> 'registration' THEN
    RETURN jsonb_build_object('success', false, 'reason', 'registration_closed');
  END IF;
  IF v_t.registration_closes_at IS NOT NULL AND now() > v_t.registration_closes_at THEN
    RETURN jsonb_build_object('success', false, 'reason', 'registration_closed');
  END IF;
  IF now() < v_t.registration_opens_at THEN
    RETURN jsonb_build_object('success', false, 'reason', 'registration_not_open');
  END IF;

  IF EXISTS (SELECT 1 FROM public.tournament_participants
             WHERE tournament_id = p_tournament_id AND user_id = v_user) THEN
    RETURN jsonb_build_object('success', true, 'already_joined', true);
  END IF;

  SELECT count(*) INTO v_count FROM public.tournament_participants
   WHERE tournament_id = p_tournament_id;
  IF v_count >= v_t.max_participants THEN
    RETURN jsonb_build_object('success', false, 'reason', 'full');
  END IF;

  INSERT INTO public.tournament_participants (tournament_id, user_id)
  VALUES (p_tournament_id, v_user);

  RETURN jsonb_build_object('success', true, 'already_joined', false,
                            'participants', v_count + 1);
END;
$$;

-- ============================================================
-- Sorteio do chaveamento (admin)
-- ============================================================
CREATE OR REPLACE FUNCTION public.start_tournament(p_tournament_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_t public.tournaments%ROWTYPE;
  v_n INTEGER;
  v_size INTEGER := 2;
  v_rounds INTEGER;
  v_order INTEGER[];
  v_slot INTEGER;
  v_home INTEGER;
  v_away INTEGER;
  v_home_id UUID;
  v_away_id UUID;
  v_round INTEGER;
  v_count INTEGER;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('success', false, 'reason', 'forbidden');
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended('tournament_start:' || p_tournament_id::text, 0));

  SELECT * INTO v_t FROM public.tournaments WHERE id = p_tournament_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_found');
  END IF;
  IF v_t.status <> 'registration' THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_status');
  END IF;

  SELECT count(*) INTO v_n FROM public.tournament_participants WHERE tournament_id = p_tournament_id;
  IF v_n < 2 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'insufficient_participants');
  END IF;

  WHILE v_size < v_n LOOP v_size := v_size * 2; END LOOP;
  v_rounds := (ln(v_size) / ln(2))::INTEGER;

  -- Semeadura determinística por XP (desc), depois nome e id.
  WITH ranked AS (
    SELECT tp.id,
           row_number() OVER (
             ORDER BY COALESCE(p.xp, 0) DESC,
                      COALESCE(p.full_name, '') ASC,
                      tp.user_id ASC
           ) AS rn
      FROM public.tournament_participants tp
      LEFT JOIN public.profiles p ON p.id = tp.user_id
     WHERE tp.tournament_id = p_tournament_id
  )
  UPDATE public.tournament_participants tp
     SET seed = ranked.rn, wins = 0, eliminated_round = NULL,
         placement = NULL
    FROM ranked
   WHERE tp.id = ranked.id;

  DELETE FROM public.tournament_matches WHERE tournament_id = p_tournament_id;

  v_order := public.tournament_seed_order(v_size);

  FOR v_slot IN 0 .. (v_size / 2 - 1) LOOP
    v_home := v_order[v_slot * 2 + 1];
    v_away := v_order[v_slot * 2 + 2];
    IF v_home > v_n THEN v_home := NULL; END IF;
    IF v_away > v_n THEN v_away := NULL; END IF;

    SELECT id INTO v_home_id FROM public.tournament_participants
     WHERE tournament_id = p_tournament_id AND seed = v_home;
    SELECT id INTO v_away_id FROM public.tournament_participants
     WHERE tournament_id = p_tournament_id AND seed = v_away;

    INSERT INTO public.tournament_matches
      (tournament_id, round, slot, home_participant_id, away_participant_id, status)
    VALUES (
      p_tournament_id, 1, v_slot, v_home_id, v_away_id,
      CASE WHEN v_home_id IS NULL OR v_away_id IS NULL THEN 'bye' ELSE 'ready' END
    );
  END LOOP;

  FOR v_round IN 2 .. v_rounds LOOP
    v_count := v_size / (2 ^ v_round)::INTEGER;
    FOR v_slot IN 0 .. (v_count - 1) LOOP
      INSERT INTO public.tournament_matches (tournament_id, round, slot, status)
      VALUES (p_tournament_id, v_round, v_slot, 'pending');
    END LOOP;
  END LOOP;

  UPDATE public.tournaments
     SET status = 'running', bracket_size = v_size, rounds = v_rounds,
         started_at = now(), champion_user_id = NULL, runner_up_user_id = NULL,
         finished_at = NULL
   WHERE id = p_tournament_id;

  -- Byes avançam imediatamente.
  PERFORM public.tournament_propagate_byes(p_tournament_id);

  RETURN jsonb_build_object('success', true, 'bracket_size', v_size,
                            'rounds', v_rounds, 'participants', v_n);
END;
$$;

-- ============================================================
-- Avanço automático de byes
-- ============================================================
CREATE OR REPLACE FUNCTION public.tournament_propagate_byes(p_tournament_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  m RECORD;
  v_winner UUID;
BEGIN
  FOR m IN
    SELECT * FROM public.tournament_matches
     WHERE tournament_id = p_tournament_id
       AND status = 'bye' AND winner_participant_id IS NULL
     ORDER BY round, slot
  LOOP
    v_winner := COALESCE(m.home_participant_id, m.away_participant_id);
    IF v_winner IS NULL THEN CONTINUE; END IF;

    UPDATE public.tournament_matches
       SET winner_participant_id = v_winner, decided_at = now()
     WHERE id = m.id;

    PERFORM public.tournament_place_winner(p_tournament_id, m.round, m.slot, v_winner);
  END LOOP;
END;
$$;

-- ============================================================
-- Coloca o vencedor na rodada seguinte (bye não conta vitória)
-- ============================================================
CREATE OR REPLACE FUNCTION public.tournament_place_winner(
  p_tournament_id UUID, p_round INTEGER, p_slot INTEGER, p_winner UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rounds INTEGER;
  v_next_slot INTEGER := p_slot / 2;
  v_next public.tournament_matches%ROWTYPE;
BEGIN
  SELECT rounds INTO v_rounds FROM public.tournaments WHERE id = p_tournament_id;
  IF p_round >= v_rounds THEN RETURN; END IF;

  IF p_slot % 2 = 0 THEN
    UPDATE public.tournament_matches
       SET home_participant_id = p_winner
     WHERE tournament_id = p_tournament_id AND round = p_round + 1 AND slot = v_next_slot;
  ELSE
    UPDATE public.tournament_matches
       SET away_participant_id = p_winner
     WHERE tournament_id = p_tournament_id AND round = p_round + 1 AND slot = v_next_slot;
  END IF;

  SELECT * INTO v_next FROM public.tournament_matches
   WHERE tournament_id = p_tournament_id AND round = p_round + 1 AND slot = v_next_slot;

  IF v_next.id IS NOT NULL AND v_next.status = 'pending' THEN
    IF v_next.home_participant_id IS NOT NULL AND v_next.away_participant_id IS NOT NULL THEN
      UPDATE public.tournament_matches SET status = 'ready' WHERE id = v_next.id;
    END IF;
  END IF;
END;
$$;

-- ============================================================
-- Registro de placar (admin) — idempotente e auditável
-- ============================================================
CREATE OR REPLACE FUNCTION public.report_tournament_match(
  p_match_id UUID, p_home_score INTEGER, p_away_score INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_m public.tournament_matches%ROWTYPE;
  v_t public.tournaments%ROWTYPE;
  v_winner UUID;
  v_loser UUID;
  v_home_seed INTEGER;
  v_away_seed INTEGER;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('success', false, 'reason', 'forbidden');
  END IF;
  IF p_home_score IS NULL OR p_away_score IS NULL
     OR p_home_score < 0 OR p_away_score < 0
     OR p_home_score > 1000 OR p_away_score > 1000 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_score');
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended('tournament_match:' || p_match_id::text, 0));

  SELECT * INTO v_m FROM public.tournament_matches WHERE id = p_match_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_found');
  END IF;
  IF v_m.status = 'decided' THEN
    RETURN jsonb_build_object('success', true, 'already_decided', true,
                              'winner_participant_id', v_m.winner_participant_id);
  END IF;
  IF v_m.home_participant_id IS NULL OR v_m.away_participant_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'match_not_ready');
  END IF;

  SELECT * INTO v_t FROM public.tournaments WHERE id = v_m.tournament_id;
  IF v_t.status <> 'running' THEN
    RETURN jsonb_build_object('success', false, 'reason', 'tournament_not_running');
  END IF;

  SELECT seed INTO v_home_seed FROM public.tournament_participants WHERE id = v_m.home_participant_id;
  SELECT seed INTO v_away_seed FROM public.tournament_participants WHERE id = v_m.away_participant_id;

  IF p_home_score > p_away_score THEN
    v_winner := v_m.home_participant_id; v_loser := v_m.away_participant_id;
  ELSIF p_away_score > p_home_score THEN
    v_winner := v_m.away_participant_id; v_loser := v_m.home_participant_id;
  ELSIF COALESCE(v_home_seed, 999) <= COALESCE(v_away_seed, 999) THEN
    v_winner := v_m.home_participant_id; v_loser := v_m.away_participant_id;
  ELSE
    v_winner := v_m.away_participant_id; v_loser := v_m.home_participant_id;
  END IF;

  UPDATE public.tournament_matches
     SET home_score = p_home_score, away_score = p_away_score,
         winner_participant_id = v_winner, status = 'decided', decided_at = now()
   WHERE id = p_match_id;

  UPDATE public.tournament_participants
     SET wins = wins + 1 WHERE id = v_winner;
  UPDATE public.tournament_participants
     SET eliminated_round = v_m.round, placement = 'eliminated'
   WHERE id = v_loser;

  PERFORM public.tournament_place_winner(v_m.tournament_id, v_m.round, v_m.slot, v_winner);

  IF v_m.round = v_t.rounds THEN
    UPDATE public.tournament_participants SET placement = 'champion' WHERE id = v_winner;
    UPDATE public.tournament_participants SET placement = 'runner_up' WHERE id = v_loser;
    UPDATE public.tournaments
       SET status = 'finished', finished_at = now(),
           champion_user_id = (SELECT user_id FROM public.tournament_participants WHERE id = v_winner),
           runner_up_user_id = (SELECT user_id FROM public.tournament_participants WHERE id = v_loser)
     WHERE id = v_m.tournament_id;
    PERFORM public.settle_tournament_rewards(v_m.tournament_id);
  END IF;

  RETURN jsonb_build_object('success', true, 'winner_participant_id', v_winner,
                            'finished', v_m.round = v_t.rounds);
END;
$$;

-- ============================================================
-- Pagamento de recompensas — uma única vez por participante
-- ============================================================
CREATE OR REPLACE FUNCTION public.settle_tournament_rewards(p_tournament_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_t public.tournaments%ROWTYPE;
  r RECORD;
  v_coins INTEGER;
  v_xp INTEGER;
  v_total_coins INTEGER := 0;
  v_total_xp INTEGER := 0;
  v_paid INTEGER := 0;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('tournament_settle:' || p_tournament_id::text, 0));

  SELECT * INTO v_t FROM public.tournaments WHERE id = p_tournament_id;
  IF NOT FOUND OR v_t.status <> 'finished' THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_finished');
  END IF;

  FOR r IN
    SELECT * FROM public.tournament_participants
     WHERE tournament_id = p_tournament_id AND rewarded_at IS NULL
     ORDER BY seed
    FOR UPDATE
  LOOP
    v_coins := r.wins * v_t.coins_per_win;
    v_xp := r.wins * v_t.xp_per_win;
    IF r.placement = 'champion' THEN
      v_coins := v_coins + v_t.coins_champion;
      v_xp := v_xp + v_t.xp_champion;
    ELSIF r.placement = 'runner_up' THEN
      v_coins := v_coins + v_t.coins_runner_up;
      v_xp := v_xp + v_t.xp_runner_up;
    END IF;

    UPDATE public.tournament_participants
       SET coins_awarded = v_coins, xp_awarded = v_xp, rewarded_at = now()
     WHERE id = r.id;

    IF v_coins > 0 OR v_xp > 0 THEN
      UPDATE public.profiles
         SET coins = coins + v_coins,
             xp = xp + v_xp,
             level = GREATEST(level, floor((xp + v_xp) / 1000) + 1)
       WHERE id = r.user_id;
      v_total_coins := v_total_coins + v_coins;
      v_total_xp := v_total_xp + v_xp;
      v_paid := v_paid + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'participants_paid', v_paid,
                            'coins', v_total_coins, 'xp', v_total_xp);
END;
$$;

-- ============================================================
-- Leitura consolidada do torneio (chave + participantes)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_tournament_bracket(p_tournament_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_t public.tournaments%ROWTYPE;
  v_result JSONB;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'unauthenticated');
  END IF;

  SELECT * INTO v_t FROM public.tournaments WHERE id = p_tournament_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_found');
  END IF;
  IF v_t.status = 'draft' AND NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_found');
  END IF;

  SELECT jsonb_build_object(
    'success', true,
    'tournament', to_jsonb(v_t),
    'joined', EXISTS (SELECT 1 FROM public.tournament_participants
                       WHERE tournament_id = p_tournament_id AND user_id = auth.uid()),
    'participants', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
               'id', tp.id, 'user_id', tp.user_id, 'seed', tp.seed,
               'wins', tp.wins, 'placement', tp.placement,
               'eliminated_round', tp.eliminated_round,
               'coins_awarded', tp.coins_awarded, 'xp_awarded', tp.xp_awarded,
               'full_name', p.full_name, 'avatar_url', p.avatar_url
             ) ORDER BY COALESCE(tp.seed, 999))
        FROM public.tournament_participants tp
        LEFT JOIN public.profiles p ON p.id = tp.user_id
       WHERE tp.tournament_id = p_tournament_id
    ), '[]'::jsonb),
    'matches', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
               'id', m.id, 'round', m.round, 'slot', m.slot,
               'home_participant_id', m.home_participant_id,
               'away_participant_id', m.away_participant_id,
               'home_score', m.home_score, 'away_score', m.away_score,
               'winner_participant_id', m.winner_participant_id,
               'status', m.status
             ) ORDER BY m.round, m.slot)
        FROM public.tournament_matches m
       WHERE m.tournament_id = p_tournament_id
    ), '[]'::jsonb)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- ============================================================
-- Lista de torneios visíveis
-- ============================================================
CREATE OR REPLACE FUNCTION public.list_tournaments()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

REVOKE ALL ON FUNCTION public.tournament_propagate_byes(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.tournament_place_winner(UUID, INTEGER, INTEGER, UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.settle_tournament_rewards(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.join_tournament(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.start_tournament(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.report_tournament_match(UUID, INTEGER, INTEGER) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_tournament_bracket(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.list_tournaments() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.join_tournament(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.start_tournament(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.report_tournament_match(UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_tournament_bracket(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_tournaments() TO authenticated;