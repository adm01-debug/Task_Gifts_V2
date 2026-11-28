CREATE OR REPLACE FUNCTION public.deal_boss_damage(_battle_id uuid, _source text, _dedupe_key text, _source_id uuid DEFAULT NULL::uuid, _multiplier numeric DEFAULT 1, _amount integer DEFAULT NULL::integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user UUID := auth.uid();
  v_battle public.boss_battles%ROWTYPE;
  v_rules JSONB; v_base INTEGER; v_mult NUMERIC;
  v_raw INTEGER; v_user_total INTEGER; v_cap INTEGER;
  v_allowed INTEGER; v_applied INTEGER;
  v_existing public.boss_battle_damage%ROWTYPE;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'auth required'; END IF;
  IF _dedupe_key IS NULL OR length(_dedupe_key) = 0 OR length(_dedupe_key) > 200 THEN RAISE EXCEPTION 'invalid dedupe_key'; END IF;
  IF _source NOT IN ('task_score','trail_completion','attendance','quiz','manual') THEN RAISE EXCEPTION 'invalid source'; END IF;
  SELECT * INTO v_existing FROM public.boss_battle_damage WHERE battle_id = _battle_id AND dedupe_key = _dedupe_key;
  IF FOUND THEN RETURN jsonb_build_object('applied', v_existing.damage, 'duplicate', true); END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(_battle_id::text, 42));
  SELECT * INTO v_battle FROM public.boss_battles WHERE id = _battle_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'battle not found'; END IF;
  IF v_battle.status <> 'running' OR now() < v_battle.starts_at OR now() > v_battle.ends_at THEN
    RETURN jsonb_build_object('applied', 0, 'reason', 'not_running');
  END IF;
  IF v_battle.current_hp <= 0 THEN RETURN jsonb_build_object('applied', 0, 'reason', 'no_hp'); END IF;
  v_rules := COALESCE(v_battle.damage_rules, '{}'::jsonb);
  IF _source = 'manual' THEN
    IF NOT (public.has_role(v_user, 'admin') OR public.has_role(v_user, 'manager')) THEN
      RAISE EXCEPTION 'manual damage requires elevated role';
    END IF;
    v_base := GREATEST(COALESCE(_amount, 0), 0);
  ELSE
    v_base := GREATEST(COALESCE((v_rules -> 'base' ->> _source)::INTEGER, 0), 0);
  END IF;
  IF v_base = 0 THEN RETURN jsonb_build_object('applied', 0, 'reason', 'zero_damage'); END IF;
  v_mult := LEAST(GREATEST(COALESCE(_multiplier, 1), 1), GREATEST(COALESCE((v_rules ->> 'maxMultiplier')::NUMERIC, 1), 1));
  v_raw := FLOOR(v_base * v_mult)::INTEGER;
  v_cap := GREATEST(v_battle.per_user_cap, 0);
  v_allowed := v_raw;
  IF v_cap > 0 THEN
    SELECT COALESCE(SUM(damage), 0) INTO v_user_total FROM public.boss_battle_damage WHERE battle_id = _battle_id AND user_id = v_user;
    v_allowed := LEAST(v_raw, GREATEST(v_cap - v_user_total, 0));
  END IF;
  v_applied := LEAST(v_allowed, v_battle.current_hp);
  INSERT INTO public.boss_battle_damage (battle_id, user_id, department_id, source, source_id, damage, wasted, dedupe_key)
  VALUES (_battle_id, v_user, public.get_user_department_id(v_user), _source, _source_id, v_applied, v_raw - v_applied, _dedupe_key);
  UPDATE public.boss_battles
    SET current_hp = current_hp - v_applied,
        status = CASE WHEN current_hp - v_applied = 0 THEN 'defeated' ELSE status END,
        defeated_at = CASE WHEN current_hp - v_applied = 0 THEN now() ELSE defeated_at END
   WHERE id = _battle_id;
  RETURN jsonb_build_object('applied', v_applied, 'wasted', v_raw - v_applied,
    'hp_after', v_battle.current_hp - v_applied, 'defeated', (v_battle.current_hp - v_applied) = 0, 'duplicate', false);
END; $function$
