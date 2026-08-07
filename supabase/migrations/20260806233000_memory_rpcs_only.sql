-- ============================================================
-- MEMORIA (Jogo da Memoria): cria apenas as RPCs que faltam
-- Tabelas memory_decks, memory_pairs, memory_sessions ja existem.
-- 2 decks + 16 pares ja estao inseridos.
-- Cole este arquivo no SQL Editor do Supabase.
-- ============================================================

-- ── start_memory_session ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.start_memory_session(p_deck_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user UUID := auth.uid();
  v_deck public.memory_decks%ROWTYPE;
  v_pairs INTEGER;
  v_session_id UUID;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;

  SELECT * INTO v_deck FROM public.memory_decks WHERE id = p_deck_id AND is_active = true;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'reason', 'no_deck'); END IF;

  SELECT count(*) INTO v_pairs FROM public.memory_pairs WHERE deck_id = p_deck_id;
  IF v_pairs < 2 THEN RETURN jsonb_build_object('success', false, 'reason', 'insufficient_pairs'); END IF;

  INSERT INTO public.memory_sessions (deck_id, user_id, pairs_total, status)
  VALUES (p_deck_id, v_user, v_pairs, 'active')
  RETURNING id INTO v_session_id;

  RETURN jsonb_build_object(
    'success', true,
    'session_id', v_session_id,
    'deck_id', p_deck_id,
    'pairs_total', v_pairs
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.start_memory_session(UUID) TO authenticated;

-- ── finish_memory_session ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.finish_memory_session(
  p_session_id UUID, p_moves INTEGER, p_matched_pairs INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user UUID := auth.uid();
  v_session public.memory_sessions%ROWTYPE;
  v_duration_ms INTEGER;
  v_perfect BOOLEAN;
  v_base_coins INTEGER := 30;
  v_perfect_bonus INTEGER := 50;
  v_coins INTEGER := 0;
  v_xp INTEGER := 0;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;

  SELECT * INTO v_session FROM public.memory_sessions
   WHERE id = p_session_id AND user_id = v_user FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'reason', 'not_found'); END IF;
  IF v_session.status = 'finished' THEN RETURN jsonb_build_object('success', false, 'reason', 'already_finished'); END IF;

  v_duration_ms := GREATEST(0, (EXTRACT(EPOCH FROM (now() - v_session.created_at)) * 1000)::int);
  v_perfect := (p_matched_pairs = v_session.pairs_total);

  IF p_matched_pairs >= 1 THEN
    v_coins := v_base_coins + (LEAST(p_matched_pairs, v_session.pairs_total) * 5);
    IF v_perfect AND p_moves <= v_session.pairs_total * 2 THEN
      v_coins := v_coins + v_perfect_bonus;
    END IF;
    v_xp := v_coins;
  END IF;

  UPDATE public.memory_sessions
     SET status = 'finished',
         moves = GREATEST(0, p_moves),
         matched_pairs = GREATEST(0, LEAST(p_matched_pairs, pairs_total)),
         duration_ms = v_duration_ms,
         coins_awarded = v_coins,
         xp_awarded = v_xp,
         finished_at = now()
   WHERE id = p_session_id;

  IF v_coins > 0 OR v_xp > 0 THEN
    UPDATE public.profiles
       SET coins = coins + v_coins,
           xp = xp + v_xp,
           level = GREATEST(level, floor((xp + v_xp) / 1000) + 1)
     WHERE id = v_user;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'duration_ms', v_duration_ms,
    'coins_awarded', v_coins,
    'xp_awarded', v_xp,
    'perfect', v_perfect
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.finish_memory_session(UUID, INTEGER, INTEGER) TO authenticated;

-- Drop existing leaderboard RPC (signature changed) before recreating
DROP FUNCTION IF EXISTS public.get_memory_leaderboard(uuid, integer, integer);
DROP FUNCTION IF EXISTS public.get_memory_leaderboard();

-- ── get_memory_leaderboard ───────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_memory_leaderboard(
  p_deck_id UUID DEFAULT NULL, p_days INTEGER DEFAULT 7, p_limit INTEGER DEFAULT 20
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user UUID := auth.uid();
  v_since TIMESTAMPTZ := now() - make_interval(days => GREATEST(1, p_days));
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;

  RETURN COALESCE((
    SELECT jsonb_agg(row ORDER BY row->>'rank')
    FROM (
      SELECT jsonb_build_object(
        'user_id', s.user_id,
        'display_name', COALESCE(p.display_name, split_part(p.email, '@', 1)),
        'avatar_url', p.avatar_url,
        'deck_id', s.deck_id,
        'matched_pairs', s.matched_pairs,
        'pairs_total', s.pairs_total,
        'moves', s.moves,
        'duration_ms', s.duration_ms,
        'coins_awarded', s.coins_awarded,
        'played_at', s.finished_at,
        'rank', row_number() OVER (ORDER BY s.matched_pairs DESC, s.duration_ms ASC)
      ) AS row
      FROM public.memory_sessions s
      JOIN public.profiles p ON p.id = s.user_id
     WHERE s.status = 'finished'
       AND s.finished_at >= v_since
       AND (p_deck_id IS NULL OR s.deck_id = p_deck_id)
     ORDER BY s.matched_pairs DESC, s.duration_ms ASC
     LIMIT LEAST(100, GREATEST(1, p_limit))
    ) sub
  ), '[]'::jsonb);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_memory_leaderboard(UUID, INTEGER, INTEGER) TO authenticated;