CREATE OR REPLACE FUNCTION public.create_prediction_market(p_title text, p_description text, p_options text[], p_min_stake integer, p_max_stake_per_user integer, p_rake_bps integer, p_locks_at timestamp with time zone, p_resolves_at timestamp with time zone DEFAULT NULL::timestamp with time zone)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_market_id uuid; v_clean text[]; v_label text; v_idx integer := 0;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT array_agg(DISTINCT btrim(o)) INTO v_clean FROM unnest(COALESCE(p_options, ARRAY[]::text[])) AS o WHERE btrim(o) <> '';
  IF v_clean IS NULL OR array_length(v_clean, 1) < 2 THEN RETURN jsonb_build_object('ok', false, 'reason', 'need_two_options'); END IF;
  IF array_length(v_clean, 1) > 6 THEN RETURN jsonb_build_object('ok', false, 'reason', 'too_many_options'); END IF;
  IF length(btrim(COALESCE(p_title, ''))) < 5 OR length(btrim(p_title)) > 140 THEN RETURN jsonb_build_object('ok', false, 'reason', 'invalid_title'); END IF;
  IF COALESCE(p_min_stake, 0) < 1 THEN RETURN jsonb_build_object('ok', false, 'reason', 'invalid_min_stake'); END IF;
  IF COALESCE(p_max_stake_per_user, 0) < 0 OR (p_max_stake_per_user > 0 AND p_max_stake_per_user < p_min_stake) THEN RETURN jsonb_build_object('ok', false, 'reason', 'invalid_user_cap'); END IF;
  IF COALESCE(p_rake_bps, 0) < 0 OR p_rake_bps > 2000 THEN RETURN jsonb_build_object('ok', false, 'reason', 'invalid_rake'); END IF;
  IF p_locks_at IS NULL OR p_locks_at <= now() + interval '15 minutes' THEN RETURN jsonb_build_object('ok', false, 'reason', 'invalid_window'); END IF;
  IF p_resolves_at IS NOT NULL AND p_resolves_at < p_locks_at THEN RETURN jsonb_build_object('ok', false, 'reason', 'invalid_resolves_at'); END IF;
  INSERT INTO public.prediction_markets (title, description, status, min_stake, max_stake_per_user, rake_bps, locks_at, resolves_at, created_by) VALUES (btrim(p_title), NULLIF(btrim(COALESCE(p_description, '')), ''), 'draft', p_min_stake, p_max_stake_per_user, p_rake_bps, p_locks_at, p_resolves_at, auth.uid()) RETURNING id INTO v_market_id;
  FOREACH v_label IN ARRAY v_clean LOOP INSERT INTO public.prediction_options (market_id, label, sort_order) VALUES (v_market_id, left(v_label, 60), v_idx); v_idx := v_idx + 1; END LOOP;
  INSERT INTO public.prediction_admin_events (market_id, action, actor_id, payload) VALUES (v_market_id, 'created', auth.uid(), jsonb_build_object('options', v_clean, 'rake_bps', p_rake_bps, 'locks_at', p_locks_at));
  RETURN jsonb_build_object('ok', true, 'market_id', v_market_id);
END; $function$
