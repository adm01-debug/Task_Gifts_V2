CREATE TABLE public.boss_battles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','running','defeated','expired','settled')),
  total_hp INTEGER NOT NULL CHECK (total_hp > 0),
  current_hp INTEGER NOT NULL CHECK (current_hp >= 0),
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ NOT NULL,
  damage_rules JSONB NOT NULL DEFAULT '{"base":{"task_score":10,"trail_completion":25,"attendance":5,"quiz":8,"manual":0},"maxMultiplier":3,"perUserCap":0}'::jsonb,
  per_user_cap INTEGER NOT NULL DEFAULT 0 CHECK (per_user_cap >= 0),
  coins_pool INTEGER NOT NULL DEFAULT 0 CHECK (coins_pool >= 0),
  xp_pool INTEGER NOT NULL DEFAULT 0 CHECK (xp_pool >= 0),
  min_share NUMERIC NOT NULL DEFAULT 0 CHECK (min_share >= 0 AND min_share <= 1),
  per_user_coins_cap INTEGER NOT NULL DEFAULT 0 CHECK (per_user_coins_cap >= 0),
  defeated_at TIMESTAMPTZ,
  settled_at TIMESTAMPTZ,
  created_by UUID DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_boss_battles_status ON public.boss_battles(status, ends_at DESC);
CREATE INDEX idx_boss_battles_department ON public.boss_battles(department_id, status);

CREATE TABLE public.boss_battle_damage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  battle_id UUID NOT NULL REFERENCES public.boss_battles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  source TEXT NOT NULL CHECK (source IN ('task_score','trail_completion','attendance','quiz','manual')),
  source_id UUID,
  damage INTEGER NOT NULL CHECK (damage >= 0),
  wasted INTEGER NOT NULL DEFAULT 0 CHECK (wasted >= 0),
  dedupe_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (battle_id, dedupe_key)
);

CREATE INDEX idx_boss_damage_battle_user ON public.boss_battle_damage(battle_id, user_id);
CREATE INDEX idx_boss_damage_battle_created ON public.boss_battle_damage(battle_id, created_at DESC);

CREATE TABLE public.boss_battle_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  battle_id UUID NOT NULL REFERENCES public.boss_battles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  damage INTEGER NOT NULL DEFAULT 0,
  share NUMERIC NOT NULL DEFAULT 0,
  coins INTEGER NOT NULL DEFAULT 0,
  xp INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (battle_id, user_id)
);

GRANT SELECT ON public.boss_battles TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.boss_battles TO authenticated;
GRANT ALL ON public.boss_battles TO service_role;
GRANT SELECT ON public.boss_battle_damage TO authenticated;
GRANT ALL ON public.boss_battle_damage TO service_role;
GRANT SELECT ON public.boss_battle_rewards TO authenticated;
GRANT ALL ON public.boss_battle_rewards TO service_role;

ALTER TABLE public.boss_battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boss_battle_damage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boss_battle_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "boss_battles_select_authenticated"
  ON public.boss_battles FOR SELECT TO authenticated
  USING (status <> 'draft' OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "boss_battles_manage_admin"
  ON public.boss_battles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "boss_damage_select"
  ON public.boss_battle_damage FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "boss_rewards_select"
  ON public.boss_battle_rewards FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE TRIGGER update_boss_battles_updated_at
  BEFORE UPDATE ON public.boss_battles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Aplica dano de forma atômica e idempotente.
CREATE OR REPLACE FUNCTION public.deal_boss_damage(
  _battle_id UUID,
  _source TEXT,
  _dedupe_key TEXT,
  _source_id UUID DEFAULT NULL,
  _multiplier NUMERIC DEFAULT 1,
  _amount INTEGER DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_battle public.boss_battles%ROWTYPE;
  v_rules JSONB;
  v_base INTEGER;
  v_mult NUMERIC;
  v_raw INTEGER;
  v_user_total INTEGER;
  v_cap INTEGER;
  v_allowed INTEGER;
  v_applied INTEGER;
  v_existing public.boss_battle_damage%ROWTYPE;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'auth required';
  END IF;
  IF _dedupe_key IS NULL OR length(_dedupe_key) = 0 OR length(_dedupe_key) > 200 THEN
    RAISE EXCEPTION 'invalid dedupe_key';
  END IF;
  IF _source NOT IN ('task_score','trail_completion','attendance','quiz','manual') THEN
    RAISE EXCEPTION 'invalid source';
  END IF;

  SELECT * INTO v_existing FROM public.boss_battle_damage
    WHERE battle_id = _battle_id AND dedupe_key = _dedupe_key;
  IF FOUND THEN
    RETURN jsonb_build_object('applied', v_existing.damage, 'duplicate', true);
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(_battle_id::text, 42));

  SELECT * INTO v_battle FROM public.boss_battles WHERE id = _battle_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'battle not found'; END IF;
  IF v_battle.status <> 'running' OR now() < v_battle.starts_at OR now() > v_battle.ends_at THEN
    RETURN jsonb_build_object('applied', 0, 'reason', 'not_running');
  END IF;
  IF v_battle.current_hp <= 0 THEN
    RETURN jsonb_build_object('applied', 0, 'reason', 'no_hp');
  END IF;

  v_rules := COALESCE(v_battle.damage_rules, '{}'::jsonb);
  IF _source = 'manual' THEN
    IF NOT (public.has_role(v_user, 'admin') OR public.has_role(v_user, 'manager')) THEN
      RAISE EXCEPTION 'manual damage requires elevated role';
    END IF;
    v_base := GREATEST(COALESCE(_amount, 0), 0);
  ELSE
    v_base := GREATEST(COALESCE((v_rules -> 'base' ->> _source)::INTEGER, 0), 0);
  END IF;

  IF v_base = 0 THEN
    RETURN jsonb_build_object('applied', 0, 'reason', 'zero_damage');
  END IF;

  v_mult := LEAST(GREATEST(COALESCE(_multiplier, 1), 1), GREATEST(COALESCE((v_rules ->> 'maxMultiplier')::NUMERIC, 1), 1));
  v_raw := FLOOR(v_base * v_mult)::INTEGER;

  v_cap := GREATEST(v_battle.per_user_cap, 0);
  v_allowed := v_raw;
  IF v_cap > 0 THEN
    SELECT COALESCE(SUM(damage), 0) INTO v_user_total
      FROM public.boss_battle_damage WHERE battle_id = _battle_id AND user_id = v_user;
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

  RETURN jsonb_build_object(
    'applied', v_applied,
    'wasted', v_raw - v_applied,
    'hp_after', v_battle.current_hp - v_applied,
    'defeated', (v_battle.current_hp - v_applied) = 0,
    'duplicate', false
  );
END;
$$;

REVOKE ALL ON FUNCTION public.deal_boss_damage(UUID, TEXT, TEXT, UUID, NUMERIC, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.deal_boss_damage(UUID, TEXT, TEXT, UUID, NUMERIC, INTEGER) TO authenticated;

-- Apura a batalha: rateio proporcional ao dano, idempotente.
CREATE OR REPLACE FUNCTION public.settle_boss_battle(_battle_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_battle public.boss_battles%ROWTYPE;
  v_total INTEGER;
  v_eligible_total INTEGER;
  v_distributed_coins INTEGER := 0;
  v_distributed_xp INTEGER := 0;
  r RECORD;
  v_coins INTEGER;
  v_xp INTEGER;
BEGIN
  PERFORM public._require_manager_or_admin();
  PERFORM pg_advisory_xact_lock(hashtextextended(_battle_id::text, 43));

  SELECT * INTO v_battle FROM public.boss_battles WHERE id = _battle_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'battle not found'; END IF;
  IF v_battle.settled_at IS NOT NULL THEN
    RETURN jsonb_build_object('already_settled', true);
  END IF;

  SELECT COALESCE(SUM(damage), 0) INTO v_total
    FROM public.boss_battle_damage WHERE battle_id = _battle_id;
  IF v_total = 0 THEN
    UPDATE public.boss_battles SET status = 'settled', settled_at = now() WHERE id = _battle_id;
    RETURN jsonb_build_object('participants', 0, 'coins', 0, 'xp', 0);
  END IF;

  SELECT COALESCE(SUM(d.total), 0) INTO v_eligible_total FROM (
    SELECT user_id, SUM(damage) AS total FROM public.boss_battle_damage
    WHERE battle_id = _battle_id GROUP BY user_id
    HAVING SUM(damage)::NUMERIC / v_total >= v_battle.min_share AND SUM(damage) > 0
  ) d;

  IF v_eligible_total = 0 THEN
    UPDATE public.boss_battles SET status = 'settled', settled_at = now() WHERE id = _battle_id;
    RETURN jsonb_build_object('participants', 0, 'coins', 0, 'xp', 0);
  END IF;

  FOR r IN
    SELECT user_id, SUM(damage) AS total FROM public.boss_battle_damage
    WHERE battle_id = _battle_id GROUP BY user_id
    HAVING SUM(damage)::NUMERIC / v_total >= v_battle.min_share AND SUM(damage) > 0
    ORDER BY SUM(damage) DESC, user_id ASC
  LOOP
    v_coins := FLOOR(v_battle.coins_pool::NUMERIC * r.total / v_eligible_total)::INTEGER;
    IF v_battle.per_user_coins_cap > 0 THEN
      v_coins := LEAST(v_coins, v_battle.per_user_coins_cap);
    END IF;
    v_xp := FLOOR(v_battle.xp_pool::NUMERIC * r.total / v_eligible_total)::INTEGER;

    INSERT INTO public.boss_battle_rewards (battle_id, user_id, damage, share, coins, xp)
    VALUES (_battle_id, r.user_id, r.total, r.total::NUMERIC / v_eligible_total, v_coins, v_xp)
    ON CONFLICT (battle_id, user_id) DO NOTHING;

    UPDATE public.profiles SET coins = coins + v_coins, xp = xp + v_xp WHERE id = r.user_id;

    v_distributed_coins := v_distributed_coins + v_coins;
    v_distributed_xp := v_distributed_xp + v_xp;
  END LOOP;

  UPDATE public.boss_battles SET status = 'settled', settled_at = now() WHERE id = _battle_id;

  RETURN jsonb_build_object('coins', v_distributed_coins, 'xp', v_distributed_xp);
END;
$$;

REVOKE ALL ON FUNCTION public.settle_boss_battle(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.settle_boss_battle(UUID) TO authenticated;