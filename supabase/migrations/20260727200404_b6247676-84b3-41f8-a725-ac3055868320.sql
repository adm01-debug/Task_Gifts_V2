-- ============ LUCKY WHEEL (Roleta da Sorte) ============

CREATE TABLE public.lucky_wheel_prizes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label TEXT NOT NULL,
  prize_type TEXT NOT NULL CHECK (prize_type IN ('coins','xp','achievement','nothing')),
  amount INTEGER NOT NULL DEFAULT 0 CHECK (amount >= 0),
  achievement_id UUID REFERENCES public.achievements(id) ON DELETE SET NULL,
  weight INTEGER NOT NULL DEFAULT 1 CHECK (weight > 0),
  color TEXT NOT NULL DEFAULT 'hsl(var(--primary))',
  icon TEXT NOT NULL DEFAULT 'gift',
  rarity TEXT NOT NULL DEFAULT 'common' CHECK (rarity IN ('common','rare','epic','legendary')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.lucky_wheel_spins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prize_id UUID REFERENCES public.lucky_wheel_prizes(id) ON DELETE SET NULL,
  prize_label TEXT NOT NULL,
  prize_type TEXT NOT NULL,
  amount INTEGER NOT NULL DEFAULT 0,
  spin_date DATE NOT NULL DEFAULT (now() AT TIME ZONE 'America/Sao_Paulo')::date,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX lucky_wheel_spins_one_per_day ON public.lucky_wheel_spins (user_id, spin_date);
CREATE INDEX lucky_wheel_spins_user_created_idx ON public.lucky_wheel_spins (user_id, created_at DESC);
CREATE INDEX lucky_wheel_prizes_active_idx ON public.lucky_wheel_prizes (is_active) WHERE is_active;

GRANT SELECT ON public.lucky_wheel_prizes TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.lucky_wheel_prizes TO authenticated;
GRANT ALL ON public.lucky_wheel_prizes TO service_role;
GRANT SELECT ON public.lucky_wheel_spins TO authenticated;
GRANT ALL ON public.lucky_wheel_spins TO service_role;

ALTER TABLE public.lucky_wheel_prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lucky_wheel_spins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view active prizes"
  ON public.lucky_wheel_prizes FOR SELECT TO authenticated
  USING (is_active OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage prizes"
  ON public.lucky_wheel_prizes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users view own spins"
  ON public.lucky_wheel_spins FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER lucky_wheel_prizes_updated_at
  BEFORE UPDATE ON public.lucky_wheel_prizes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============ RPCs ============

CREATE OR REPLACE FUNCTION public.get_lucky_wheel_status()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_today DATE := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  v_last RECORD;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  SELECT * INTO v_last FROM public.lucky_wheel_spins
   WHERE user_id = v_user ORDER BY created_at DESC LIMIT 1;

  RETURN jsonb_build_object(
    'can_spin', NOT EXISTS (
      SELECT 1 FROM public.lucky_wheel_spins
       WHERE user_id = v_user AND spin_date = v_today
    ),
    'today', v_today,
    'last_spin', CASE WHEN v_last IS NULL THEN NULL ELSE jsonb_build_object(
      'prize_label', v_last.prize_label,
      'prize_type', v_last.prize_type,
      'amount', v_last.amount,
      'spin_date', v_last.spin_date,
      'created_at', v_last.created_at
    ) END,
    'total_spins', (SELECT count(*) FROM public.lucky_wheel_spins WHERE user_id = v_user)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.spin_lucky_wheel()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_today DATE := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  v_total_weight BIGINT;
  v_roll BIGINT;
  v_prize RECORD;
  v_acc BIGINT := 0;
  v_new_xp INTEGER;
  v_new_level INTEGER;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  -- Trava por usuário para evitar corrida (duplo clique / múltiplas abas)
  PERFORM pg_advisory_xact_lock(hashtext('lucky_wheel:' || v_user::text));

  IF EXISTS (SELECT 1 FROM public.lucky_wheel_spins WHERE user_id = v_user AND spin_date = v_today) THEN
    RETURN jsonb_build_object('success', false, 'reason', 'already_spun');
  END IF;

  SELECT COALESCE(sum(weight), 0) INTO v_total_weight
    FROM public.lucky_wheel_prizes WHERE is_active;

  IF v_total_weight = 0 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'no_prizes');
  END IF;

  v_roll := floor(random() * v_total_weight)::bigint;

  FOR v_prize IN
    SELECT * FROM public.lucky_wheel_prizes WHERE is_active ORDER BY created_at, id
  LOOP
    v_acc := v_acc + v_prize.weight;
    EXIT WHEN v_roll < v_acc;
  END LOOP;

  -- Crédito do prêmio
  IF v_prize.prize_type = 'coins' AND v_prize.amount > 0 THEN
    UPDATE public.profiles SET coins = coins + v_prize.amount WHERE id = v_user;
  ELSIF v_prize.prize_type = 'xp' AND v_prize.amount > 0 THEN
    UPDATE public.profiles
       SET xp = xp + v_prize.amount,
           level = GREATEST(level, floor((xp + v_prize.amount) / 1000) + 1)
     WHERE id = v_user
     RETURNING xp, level INTO v_new_xp, v_new_level;
  ELSIF v_prize.prize_type = 'achievement' AND v_prize.achievement_id IS NOT NULL THEN
    INSERT INTO public.user_achievements (user_id, achievement_id)
    VALUES (v_user, v_prize.achievement_id)
    ON CONFLICT DO NOTHING;
  END IF;

  INSERT INTO public.lucky_wheel_spins (user_id, prize_id, prize_label, prize_type, amount, spin_date)
  VALUES (v_user, v_prize.id, v_prize.label, v_prize.prize_type, v_prize.amount, v_today);

  RETURN jsonb_build_object(
    'success', true,
    'prize_id', v_prize.id,
    'prize_label', v_prize.label,
    'prize_type', v_prize.prize_type,
    'amount', v_prize.amount,
    'rarity', v_prize.rarity,
    'new_xp', v_new_xp,
    'new_level', v_new_level
  );
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('success', false, 'reason', 'already_spun');
END;
$$;

REVOKE ALL ON FUNCTION public.spin_lucky_wheel() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_lucky_wheel_status() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.spin_lucky_wheel() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_lucky_wheel_status() TO authenticated;

-- Prêmios iniciais
INSERT INTO public.lucky_wheel_prizes (label, prize_type, amount, weight, color, icon, rarity) VALUES
  ('10 Moedas',  'coins',   10,  30, 'hsl(45 93% 47%)',  'coins',   'common'),
  ('25 Moedas',  'coins',   25,  20, 'hsl(45 93% 40%)',  'coins',   'common'),
  ('50 XP',      'xp',      50,  25, 'hsl(217 91% 60%)', 'zap',     'common'),
  ('150 XP',     'xp',     150,  12, 'hsl(217 91% 45%)', 'zap',     'rare'),
  ('100 Moedas', 'coins',  100,   7, 'hsl(280 70% 55%)', 'gem',     'rare'),
  ('500 XP',     'xp',     500,   3, 'hsl(160 84% 39%)', 'rocket',  'epic'),
  ('Jackpot: 500 Moedas', 'coins', 500, 1, 'hsl(0 84% 60%)', 'crown', 'legendary'),
  ('Quase lá!',  'nothing',  0,   2, 'hsl(215 16% 47%)', 'ghost',   'common');