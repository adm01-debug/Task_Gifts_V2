CREATE OR REPLACE FUNCTION public.finish_memory_session(p_session_id uuid, p_moves integer, p_matched_pairs integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
