CREATE OR REPLACE FUNCTION public.start_memory_session(p_deck_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
