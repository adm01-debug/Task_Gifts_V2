CREATE OR REPLACE FUNCTION public.get_or_create_bingo_card(p_board_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user UUID := auth.uid();
  v_board RECORD;
  v_card public.bingo_cards%ROWTYPE;
  v_cells JSONB;
  v_count INTEGER;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;

  IF p_board_id IS NULL THEN
    SELECT * INTO v_board FROM public.bingo_boards
     WHERE is_active AND now() BETWEEN starts_at AND ends_at
     ORDER BY starts_at DESC LIMIT 1;
  ELSE
    SELECT * INTO v_board FROM public.bingo_boards WHERE id = p_board_id;
  END IF;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'no_board');
  END IF;

  SELECT count(*) INTO v_count FROM public.bingo_board_tasks WHERE board_id = v_board.id;
  IF v_count < 24 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'insufficient_tasks');
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('bingo_card:' || v_user::text || ':' || v_board.id::text));

  SELECT * INTO v_card FROM public.bingo_cards
   WHERE board_id = v_board.id AND user_id = v_user;

  IF NOT FOUND THEN
    WITH picked AS (
      SELECT t.id, t.label, t.metric_key, t.target_value,
             row_number() OVER (
               ORDER BY md5(v_user::text || v_board.id::text || t.id::text)
             ) - 1 AS rn
        FROM public.bingo_board_tasks t
       WHERE t.board_id = v_board.id
       LIMIT 24
    ), positioned AS (
      SELECT jsonb_build_object(
               'position', CASE WHEN rn < 12 THEN rn ELSE rn + 1 END,
               'task_id', id, 'label', label,
               'metric_key', metric_key, 'target', target_value,
               'free', false) AS cell
        FROM picked
      UNION ALL
      SELECT jsonb_build_object(
               'position', 12, 'task_id', NULL, 'label', 'Espaco livre',
               'metric_key', 'free', 'target', 0, 'free', true)
    )
    SELECT jsonb_agg(cell ORDER BY (cell->>'position')::int) INTO v_cells FROM positioned;

    INSERT INTO public.bingo_cards (board_id, user_id, cells)
    VALUES (v_board.id, v_user, v_cells)
    ON CONFLICT (board_id, user_id) DO NOTHING;

    SELECT * INTO v_card FROM public.bingo_cards
     WHERE board_id = v_board.id AND user_id = v_user;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'card_id', v_card.id,
    'board', jsonb_build_object(
      'id', v_board.id, 'title', v_board.title, 'description', v_board.description,
      'starts_at', v_board.starts_at, 'ends_at', v_board.ends_at,
      'coins_per_line', v_board.coins_per_line, 'xp_per_line', v_board.xp_per_line,
      'coins_full_house', v_board.coins_full_house, 'xp_full_house', v_board.xp_full_house),
    'cells', v_card.cells,
    'lines_awarded', v_card.lines_awarded,
    'full_house_awarded', v_card.full_house_awarded,
    'coins_awarded', v_card.coins_awarded,
    'xp_awarded', v_card.xp_awarded);
END;
$function$
