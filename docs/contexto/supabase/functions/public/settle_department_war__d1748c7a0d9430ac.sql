CREATE OR REPLACE FUNCTION public.settle_department_war(p_war_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_war public.department_wars%ROWTYPE;
  v_standings jsonb; v_row jsonb;
  v_shares numeric[]; v_share_sum numeric := 0;
  v_index int := 0; v_fraction numeric;
  v_coins_budget int; v_xp_budget int;
  v_members int; v_coins_pm int; v_xp_pm int;
  v_total_coins int := 0; v_total_xp int := 0; v_members_paid int := 0;
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN jsonb_build_object('success', false, 'reason', 'forbidden'); END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended('department_war_settle:' || p_war_id::text, 0));

  SELECT * INTO v_war FROM public.department_wars WHERE id = p_war_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'reason', 'not_found'); END IF;
  IF v_war.settled_at IS NOT NULL THEN RETURN jsonb_build_object('success', true, 'already_settled', true); END IF;
  IF v_war.status NOT IN ('running', 'finished') THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_status'); END IF;

  SELECT (public.get_department_war_standings(p_war_id) -> 'standings') INTO v_standings;
  IF v_standings IS NULL THEN v_standings := '[]'::jsonb; END IF;

  SELECT array_agg(GREATEST((value #>> '{}')::numeric, 0) ORDER BY ord) INTO v_shares
    FROM jsonb_array_elements(v_war.placement_shares) WITH ORDINALITY AS t(value, ord);

  FOR v_index IN 1 .. LEAST(COALESCE(array_length(v_shares, 1), 0), jsonb_array_length(v_standings)) LOOP
    v_share_sum := v_share_sum + v_shares[v_index];
  END LOOP;

  v_index := 0;
  FOR v_row IN SELECT * FROM jsonb_array_elements(v_standings) LOOP
    v_index := v_index + 1;
    v_coins_pm := 0; v_xp_pm := 0; v_coins_budget := 0; v_xp_budget := 0;
    v_members := GREATEST((v_row ->> 'headcount')::int, 1);

    IF v_index <= COALESCE(array_length(v_shares, 1), 0) AND v_share_sum > 0 THEN
      v_fraction := v_shares[v_index] / v_share_sum;
      v_coins_budget := floor(v_war.coins_pool * v_fraction)::int;
      v_xp_budget := floor(v_war.xp_pool * v_fraction)::int;
      v_coins_pm := floor(v_coins_budget::numeric / v_members)::int;
      IF v_war.per_member_coins_cap > 0 THEN v_coins_pm := LEAST(v_coins_pm, v_war.per_member_coins_cap); END IF;
      v_xp_pm := floor(v_xp_budget::numeric / v_members)::int;
    END IF;

    INSERT INTO public.department_war_results (
      war_id, department_id, position, score, raw_score, contributors,
      participation_rate, coins_per_member, xp_per_member, coins_total, xp_total
    ) VALUES (
      p_war_id, (v_row ->> 'department_id')::uuid, (v_row ->> 'position')::int,
      (v_row ->> 'score')::numeric, (v_row ->> 'raw_score')::numeric,
      (v_row ->> 'contributors')::int, (v_row ->> 'participation_rate')::numeric,
      v_coins_pm, v_xp_pm, v_coins_pm * v_members, v_xp_pm * v_members
    ) ON CONFLICT (war_id, department_id) DO NOTHING;

    IF v_coins_pm > 0 OR v_xp_pm > 0 THEN
      WITH members AS (
        SELECT DISTINCT up.user_id FROM public.user_positions up
        JOIN public.positions pos ON pos.id = up.position_id
        WHERE up.ended_at IS NULL AND pos.department_id = (v_row ->> 'department_id')::uuid
      ), paid AS (
        UPDATE public.profiles p SET coins = p.coins + v_coins_pm, xp = p.xp + v_xp_pm,
          level = GREATEST(p.level, floor((p.xp + v_xp_pm) / 1000) + 1), updated_at = now()
        FROM members m WHERE p.id = m.user_id AND p.status = 'confirmed'
        RETURNING 1
      ) SELECT COUNT(*)::int INTO v_members FROM paid;
      v_members_paid := v_members_paid + v_members;
      v_total_coins := v_total_coins + (v_coins_pm * v_members);
      v_total_xp := v_total_xp + (v_xp_pm * v_members);
    END IF;
  END LOOP;

  UPDATE public.department_wars SET status = 'finished', settled_at = now(), updated_at = now() WHERE id = p_war_id;

  RETURN jsonb_build_object('success', true, 'already_settled', false, 'departments', v_index,
    'members_paid', v_members_paid, 'coins', v_total_coins, 'xp', v_total_xp);
END;
$function$
