-- ============================================================
-- BINGO: cria apenas as RPCs que faltam
-- Tabelas bingo_boards, bingo_board_tasks, bingo_cards, bingo_marks
-- ja existem. Board + 24 tasks ja estao inseridos.
-- Cole este arquivo no SQL Editor do Supabase.
-- ============================================================

-- ── Resolvedor de metricas (chamado pela RPC sync_bingo_card) ──
CREATE OR REPLACE FUNCTION public.bingo_metric_value(
  p_user UUID, p_key TEXT, p_from TIMESTAMPTZ, p_to TIMESTAMPTZ
) RETURNS INTEGER
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v INTEGER := 0;
BEGIN
  IF p_user IS NULL OR p_key IS NULL THEN RETURN 0; END IF;

  CASE p_key
    WHEN 'tasks_completed' THEN
      SELECT count(*) INTO v FROM task_scores
       WHERE user_id = p_user AND status = 'completed'
         AND completed_at BETWEEN p_from AND p_to;
    WHEN 'tasks_on_time' THEN
      SELECT count(*) INTO v FROM task_scores
       WHERE user_id = p_user AND status = 'completed' AND COALESCE(is_late,false) = false
         AND completed_at BETWEEN p_from AND p_to;
    WHEN 'tasks_no_rework' THEN
      SELECT count(*) INTO v FROM task_scores
       WHERE user_id = p_user AND status = 'completed' AND COALESCE(rework_count,0) = 0
         AND completed_at BETWEEN p_from AND p_to;
    WHEN 'attendance_days' THEN
      SELECT count(DISTINCT date(check_in)) INTO v FROM attendance_records
       WHERE user_id = p_user AND check_in BETWEEN p_from AND p_to;
    WHEN 'attendance_punctual' THEN
      SELECT count(DISTINCT date(check_in)) INTO v FROM attendance_records
       WHERE user_id = p_user AND COALESCE(is_punctual,false) = true
         AND check_in BETWEEN p_from AND p_to;
    WHEN 'kudos_sent' THEN
      SELECT count(*) INTO v FROM kudos
       WHERE from_user_id = p_user AND created_at BETWEEN p_from AND p_to;
    WHEN 'kudos_received' THEN
      SELECT count(*) INTO v FROM kudos
       WHERE to_user_id = p_user AND created_at BETWEEN p_from AND p_to;
    WHEN 'quiz_played' THEN
      SELECT count(*) INTO v FROM quiz_scores
       WHERE user_id = p_user AND COALESCE(played_at, created_at) BETWEEN p_from AND p_to;
    WHEN 'wheel_spins' THEN
      SELECT count(*) INTO v FROM lucky_wheel_spins
       WHERE user_id = p_user AND created_at BETWEEN p_from AND p_to;
    WHEN 'scratch_revealed' THEN
      SELECT count(*) INTO v FROM scratch_cards
       WHERE user_id = p_user AND status = 'revealed'
         AND revealed_at BETWEEN p_from AND p_to;
    WHEN 'lightning_rounds' THEN
      SELECT count(*) INTO v FROM lightning_quiz_sessions
       WHERE user_id = p_user AND status = 'finished'
         AND started_at BETWEEN p_from AND p_to;
    WHEN 'lightning_correct' THEN
      SELECT COALESCE(sum(correct_count),0) INTO v FROM lightning_quiz_sessions
       WHERE user_id = p_user AND status = 'finished'
         AND started_at BETWEEN p_from AND p_to;
    WHEN 'mood_entries' THEN
      SELECT count(DISTINCT entry_date) INTO v FROM mood_entries
       WHERE user_id = p_user AND created_at BETWEEN p_from AND p_to;
    WHEN 'reactions_given' THEN
      SELECT count(*) INTO v FROM activity_reactions
       WHERE user_id = p_user AND created_at BETWEEN p_from AND p_to;
    WHEN 'comments_posted' THEN
      SELECT count(*) INTO v FROM activity_comments
       WHERE user_id = p_user AND created_at BETWEEN p_from AND p_to;
    WHEN 'modules_completed' THEN
      SELECT count(*) INTO v FROM module_progress
       WHERE user_id = p_user AND completed_at BETWEEN p_from AND p_to;
    WHEN 'goal_updates' THEN
      SELECT count(*) INTO v FROM goal_updates
       WHERE user_id = p_user AND created_at BETWEEN p_from AND p_to;
    WHEN 'announcements_read' THEN
      SELECT count(*) INTO v FROM announcement_reads
       WHERE user_id = p_user AND read_at BETWEEN p_from AND p_to;
    WHEN 'checkins_done' THEN
      SELECT count(*) INTO v FROM checkins
       WHERE employee_id = p_user AND status = 'completed'
         AND COALESCE(completed_at, updated_at) BETWEEN p_from AND p_to;
    WHEN 'opinions_sent' THEN
      SELECT count(*) INTO v FROM opinions
       WHERE sender_id = p_user AND created_at BETWEEN p_from AND p_to;
    ELSE
      v := 0;
  END CASE;

  RETURN COALESCE(v, 0);
END;
$$;

REVOKE ALL ON FUNCTION public.bingo_metric_value(UUID, TEXT, TIMESTAMPTZ, TIMESTAMPTZ) FROM PUBLIC, anon, authenticated;

-- ── get_or_create_bingo_card ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_or_create_bingo_card(p_board_id UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
$$;

REVOKE ALL ON FUNCTION public.get_or_create_bingo_card(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_or_create_bingo_card(UUID) TO authenticated;

-- ── sync_bingo_card ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.sync_bingo_card(p_card_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
$$;

REVOKE ALL ON FUNCTION public.sync_bingo_card(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sync_bingo_card(UUID) TO authenticated;