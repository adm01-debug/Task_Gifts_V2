CREATE TABLE public.memory_decks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.memory_pairs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deck_id UUID NOT NULL REFERENCES public.memory_decks(id) ON DELETE CASCADE,
  term TEXT NOT NULL,
  match TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_memory_pairs_deck ON public.memory_pairs(deck_id);

CREATE TABLE public.memory_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  deck_id UUID NOT NULL REFERENCES public.memory_decks(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','finished')),
  pairs_total INTEGER NOT NULL DEFAULT 0,
  matched_pairs INTEGER NOT NULL DEFAULT 0,
  moves INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  coins_awarded INTEGER NOT NULL DEFAULT 0,
  xp_awarded INTEGER NOT NULL DEFAULT 0,
  session_date DATE NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_memory_sessions_user_date ON public.memory_sessions(user_id, session_date DESC);

GRANT SELECT ON public.memory_decks TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.memory_decks TO authenticated;
GRANT ALL ON public.memory_decks TO service_role;
GRANT SELECT ON public.memory_pairs TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.memory_pairs TO authenticated;
GRANT ALL ON public.memory_pairs TO service_role;
GRANT SELECT ON public.memory_sessions TO authenticated;
GRANT ALL ON public.memory_sessions TO service_role;

ALTER TABLE public.memory_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "memory_decks_select" ON public.memory_decks
  FOR SELECT TO authenticated
  USING (is_active OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "memory_decks_admin_write" ON public.memory_decks
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "memory_pairs_select" ON public.memory_pairs
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.memory_decks d
     WHERE d.id = memory_pairs.deck_id
       AND (d.is_active OR public.has_role(auth.uid(), 'admin'))
  ));
CREATE POLICY "memory_pairs_admin_write" ON public.memory_pairs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "memory_sessions_select_own" ON public.memory_sessions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_memory_decks_updated_at BEFORE UPDATE ON public.memory_decks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_memory_pairs_updated_at BEFORE UPDATE ON public.memory_pairs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_memory_sessions_updated_at BEFORE UPDATE ON public.memory_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.start_memory_session(p_deck_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_pairs INTEGER;
  v_active UUID;
  v_id UUID;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Nao autenticado';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('memory_game:' || v_user::text));

  IF NOT EXISTS (SELECT 1 FROM public.memory_decks WHERE id = p_deck_id AND is_active) THEN
    RETURN jsonb_build_object('success', false, 'reason', 'deck_not_found');
  END IF;

  SELECT count(*) INTO v_pairs FROM public.memory_pairs WHERE deck_id = p_deck_id;
  IF v_pairs < 2 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'deck_empty');
  END IF;

  -- Reaproveita uma partida ainda aberta do mesmo baralho (retentativa/rede instavel).
  SELECT id INTO v_active
    FROM public.memory_sessions
   WHERE user_id = v_user AND deck_id = p_deck_id AND status = 'active'
     AND started_at > now() - interval '2 hours'
   ORDER BY started_at DESC
   LIMIT 1;

  IF v_active IS NOT NULL THEN
    RETURN jsonb_build_object('success', true, 'replayed', true,
      'session_id', v_active, 'pairs_total', v_pairs);
  END IF;

  INSERT INTO public.memory_sessions (user_id, deck_id, pairs_total)
  VALUES (v_user, p_deck_id, v_pairs)
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('success', true, 'replayed', false,
    'session_id', v_id, 'pairs_total', v_pairs);
END;
$$;

CREATE OR REPLACE FUNCTION public.finish_memory_session(
  p_session_id UUID,
  p_moves INTEGER,
  p_matched_pairs INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_s RECORD;
  v_moves INTEGER;
  v_matched INTEGER;
  v_elapsed_ms INTEGER;
  v_rewarded_today INTEGER;
  v_coins INTEGER := 0;
  v_xp INTEGER := 0;
  v_perfect BOOLEAN := false;
  v_speed BOOLEAN := false;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Nao autenticado';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('memory_game:' || v_user::text));

  SELECT * INTO v_s FROM public.memory_sessions
   WHERE id = p_session_id AND user_id = v_user
   FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_found');
  END IF;

  IF v_s.status = 'finished' THEN
    RETURN jsonb_build_object('success', true, 'replayed', true,
      'matched_pairs', v_s.matched_pairs, 'moves', v_s.moves,
      'duration_ms', v_s.duration_ms,
      'coins_awarded', v_s.coins_awarded, 'xp_awarded', v_s.xp_awarded);
  END IF;

  -- Saneamento: o cliente nunca define a recompensa, apenas relata o desempenho.
  v_matched := LEAST(GREATEST(COALESCE(p_matched_pairs, 0), 0), v_s.pairs_total);
  v_moves := GREATEST(COALESCE(p_moves, 0), v_matched);
  v_elapsed_ms := GREATEST(0, LEAST(3600000,
    (EXTRACT(EPOCH FROM (now() - v_s.started_at)) * 1000)::INTEGER));

  SELECT count(*) INTO v_rewarded_today
    FROM public.memory_sessions
   WHERE user_id = v_user
     AND status = 'finished'
     AND session_date = (now() AT TIME ZONE 'utc')::date
     AND (coins_awarded > 0 OR xp_awarded > 0);

  IF v_rewarded_today < 3 THEN
    v_perfect := v_matched = v_s.pairs_total AND v_moves <= CEIL(v_s.pairs_total * 1.5);
    v_speed := v_matched = v_s.pairs_total AND v_elapsed_ms <= v_s.pairs_total * 6000;
    v_coins := LEAST(200, v_matched * 10
      + CASE WHEN v_perfect THEN 30 ELSE 0 END
      + CASE WHEN v_speed THEN 20 ELSE 0 END);
    v_xp := LEAST(300, v_matched * 15
      + CASE WHEN v_perfect THEN 40 ELSE 0 END
      + CASE WHEN v_speed THEN 25 ELSE 0 END);
  END IF;

  UPDATE public.memory_sessions
     SET status = 'finished', finished_at = now(),
         matched_pairs = v_matched, moves = v_moves,
         duration_ms = v_elapsed_ms,
         coins_awarded = v_coins, xp_awarded = v_xp
   WHERE id = v_s.id AND status = 'active';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'race');
  END IF;

  IF v_coins > 0 OR v_xp > 0 THEN
    UPDATE public.profiles
       SET coins = coins + v_coins,
           xp = xp + v_xp,
           level = GREATEST(level, floor((xp + v_xp) / 1000) + 1)
     WHERE id = v_user;
  END IF;

  RETURN jsonb_build_object('success', true, 'replayed', false,
    'matched_pairs', v_matched, 'moves', v_moves,
    'duration_ms', v_elapsed_ms,
    'perfect_bonus', v_perfect, 'speed_bonus', v_speed,
    'daily_limit_reached', v_rewarded_today >= 3,
    'coins_awarded', v_coins, 'xp_awarded', v_xp);
END;
$$;

REVOKE ALL ON FUNCTION public.start_memory_session(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.finish_memory_session(UUID, INTEGER, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.start_memory_session(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.finish_memory_session(UUID, INTEGER, INTEGER) TO authenticated;