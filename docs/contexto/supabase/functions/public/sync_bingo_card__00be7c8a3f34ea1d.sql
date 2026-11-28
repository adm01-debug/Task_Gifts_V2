CREATE OR REPLACE FUNCTION public.sync_bingo_card(p_card_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user UUID := auth.uid();
  v_card public.bingo_cards%ROWTYPE;
  v_board public.bingo_boards%ROWTYPE;
  v_cell JSONB;
  v_pos INTEGER;
  v_value INTEGER;
  v_marked BOOLEAN[] := ARRAY(SELECT false FROM generate_series(1,25));
  v_lines INTEGER := 0;
  v_full BOOLEAN;
  v_new_lines INTEGER;
  v_coins INTEGER := 0;
  v_xp INTEGER := 0;
  i INTEGER;
  j INTEGER;
  v_ok BOOLEAN;
  v_progress JSONB := '[]'::jsonb;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;

  PERFORM pg_advisory_xact_lock(hashtext('bingo_sync:' || v_user::text));

  SELECT * INTO v_card FROM public.bingo_cards
   WHERE id = p_card_id AND user_id = v_user FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_found');
  END IF;

  SELECT * INTO v_board FROM public.bingo_boards WHERE id = v_card.board_id;

  FOR v_cell IN SELECT * FROM jsonb_array_elements(v_card.cells) LOOP
    v_pos := (v_cell->>'position')::int;
    IF COALESCE((v_cell->>'free')::boolean, false) THEN
      v_value := 1;
      v_ok := true;
    ELSE
      v_value := public.bingo_metric_value(
        v_user, v_cell->>'metric_key', v_board.starts_at, LEAST(now(), v_board.ends_at));
      v_ok := v_value >= GREATEST(1, COALESCE((v_cell->>'target')::int, 1));
    END IF;

    v_progress := v_progress || jsonb_build_object('position', v_pos, 'value', v_value);

    IF v_ok THEN
      v_marked[v_pos + 1] := true;
      INSERT INTO public.bingo_marks (card_id, user_id, position, metric_key, observed_value)
      VALUES (v_card.id, v_user, v_pos, COALESCE(v_cell->>'metric_key','free'), v_value)
      ON CONFLICT (card_id, position) DO NOTHING;
    END IF;
  END LOOP;

  FOR i IN 0..4 LOOP
    v_ok := true;
    FOR j IN 0..4 LOOP
      IF NOT v_marked[i*5 + j + 1] THEN v_ok := false; END IF;
    END LOOP;
    IF v_ok THEN v_lines := v_lines + 1; END IF;
  END LOOP;

  FOR j IN 0..4 LOOP
    v_ok := true;
    FOR i IN 0..4 LOOP
      IF NOT v_marked[i*5 + j + 1] THEN v_ok := false; END IF;
    END LOOP;
    IF v_ok THEN v_lines := v_lines + 1; END IF;
  END LOOP;

  v_ok := true;
  FOR i IN 0..4 LOOP
    IF NOT v_marked[i*5 + i + 1] THEN v_ok := false; END IF;
  END LOOP;
  IF v_ok THEN v_lines := v_lines + 1; END IF;

  v_ok := true;
  FOR i IN 0..4 LOOP
    IF NOT v_marked[i*5 + (4-i) + 1] THEN v_ok := false; END IF;
  END LOOP;
  IF v_ok THEN v_lines := v_lines + 1; END IF;

  v_full := true;
  FOR i IN 1..25 LOOP
    IF NOT v_marked[i] THEN v_full := false; END IF;
  END LOOP;

  v_new_lines := GREATEST(0, v_lines - v_card.lines_awarded);
  v_coins := v_new_lines * v_board.coins_per_line;
  v_xp := v_new_lines * v_board.xp_per_line;

  IF v_full AND NOT v_card.full_house_awarded THEN
    v_coins := v_coins + v_board.coins_full_house;
    v_xp := v_xp + v_board.xp_full_house;
  END IF;

  UPDATE public.bingo_cards
     SET lines_awarded = GREATEST(lines_awarded, v_lines),
         full_house_awarded = full_house_awarded OR v_full,
         coins_awarded = coins_awarded + v_coins,
         xp_awarded = xp_awarded + v_xp,
         last_synced_at = now()
   WHERE id = v_card.id
     AND lines_awarded = v_card.lines_awarded
     AND full_house_awarded = v_card.full_house_awarded;

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

  RETURN jsonb_build_object(
    'success', true,
    'lines', v_lines,
    'new_lines', v_new_lines,
    'full_house', v_full,
    'coins_awarded', v_coins,
    'xp_awarded', v_xp,
    'progress', v_progress);
END;
$function$
