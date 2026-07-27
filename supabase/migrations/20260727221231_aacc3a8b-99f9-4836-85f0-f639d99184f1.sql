CREATE TABLE public.scratch_card_prizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL CHECK (btrim(label) <> '' AND length(label) <= 80),
  prize_type TEXT NOT NULL CHECK (prize_type IN ('coins','xp','nothing')),
  amount INTEGER NOT NULL DEFAULT 0 CHECK (amount >= 0 AND amount <= 100000),
  weight INTEGER NOT NULL DEFAULT 1 CHECK (weight >= 0 AND weight <= 1000000),
  rarity TEXT NOT NULL DEFAULT 'common' CHECK (rarity IN ('common','rare','epic','legendary')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.scratch_card_prizes TO authenticated;
GRANT ALL ON public.scratch_card_prizes TO service_role;
ALTER TABLE public.scratch_card_prizes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scratch_prizes_select_authenticated" ON public.scratch_card_prizes
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "scratch_prizes_admin_manage" ON public.scratch_card_prizes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.scratch_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('task','training','quest','campaign','manual')),
  source_ref TEXT,
  dedupe_key TEXT NOT NULL CHECK (length(dedupe_key) <= 160),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','revealed')),
  prize_id UUID REFERENCES public.scratch_card_prizes(id) ON DELETE SET NULL,
  prize_label TEXT,
  prize_type TEXT,
  amount INTEGER NOT NULL DEFAULT 0,
  rarity TEXT,
  revealed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX scratch_cards_user_dedupe_uidx ON public.scratch_cards (user_id, dedupe_key);
CREATE INDEX scratch_cards_user_status_idx ON public.scratch_cards (user_id, status, created_at DESC);

GRANT SELECT ON public.scratch_cards TO authenticated;
GRANT ALL ON public.scratch_cards TO service_role;
ALTER TABLE public.scratch_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scratch_cards_select_own" ON public.scratch_cards
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER scratch_card_prizes_updated_at BEFORE UPDATE ON public.scratch_card_prizes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER scratch_cards_updated_at BEFORE UPDATE ON public.scratch_cards
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE FUNCTION public.grant_scratch_card(p_source TEXT, p_source_ref TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_key TEXT;
  v_id UUID;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;
  IF p_source NOT IN ('task','training','quest','campaign','manual') THEN
    RAISE EXCEPTION 'origem inválida';
  END IF;

  v_key := 'grant:' || p_source || ':' || COALESCE(NULLIF(btrim(p_source_ref), ''), 'none');
  IF length(v_key) > 160 THEN
    RAISE EXCEPTION 'referência de origem muito longa';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('scratch_card:' || v_user::text));

  SELECT id INTO v_id FROM public.scratch_cards
   WHERE user_id = v_user AND dedupe_key = v_key;

  IF FOUND THEN
    RETURN jsonb_build_object('success', true, 'replayed', true, 'card_id', v_id);
  END IF;

  INSERT INTO public.scratch_cards (user_id, source, source_ref, dedupe_key)
  VALUES (v_user, p_source, NULLIF(btrim(p_source_ref), ''), v_key)
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('success', true, 'replayed', false, 'card_id', v_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.reveal_scratch_card(p_card_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_card RECORD;
  v_total BIGINT;
  v_roll BIGINT;
  v_acc BIGINT := 0;
  v_prize RECORD;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('scratch_card:' || v_user::text));

  SELECT * INTO v_card FROM public.scratch_cards
   WHERE id = p_card_id AND user_id = v_user
   FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_found');
  END IF;

  IF v_card.status = 'revealed' THEN
    RETURN jsonb_build_object(
      'success', true, 'replayed', true,
      'prize_label', v_card.prize_label, 'prize_type', v_card.prize_type,
      'amount', v_card.amount, 'rarity', COALESCE(v_card.rarity, 'common')
    );
  END IF;

  SELECT COALESCE(sum(weight), 0) INTO v_total
    FROM public.scratch_card_prizes WHERE is_active;

  IF v_total = 0 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'no_prizes');
  END IF;

  v_roll := floor(random() * v_total)::bigint;

  FOR v_prize IN
    SELECT * FROM public.scratch_card_prizes WHERE is_active ORDER BY created_at, id
  LOOP
    v_acc := v_acc + v_prize.weight;
    EXIT WHEN v_roll < v_acc;
  END LOOP;

  UPDATE public.scratch_cards
     SET status = 'revealed',
         prize_id = v_prize.id,
         prize_label = v_prize.label,
         prize_type = v_prize.prize_type,
         amount = v_prize.amount,
         rarity = v_prize.rarity,
         revealed_at = now()
   WHERE id = v_card.id AND status = 'pending';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'race');
  END IF;

  IF v_prize.prize_type = 'coins' AND v_prize.amount > 0 THEN
    UPDATE public.profiles SET coins = coins + v_prize.amount WHERE id = v_user;
  ELSIF v_prize.prize_type = 'xp' AND v_prize.amount > 0 THEN
    UPDATE public.profiles
       SET xp = xp + v_prize.amount,
           level = GREATEST(level, floor((xp + v_prize.amount) / 1000) + 1)
     WHERE id = v_user;
  END IF;

  RETURN jsonb_build_object(
    'success', true, 'replayed', false,
    'prize_id', v_prize.id, 'prize_label', v_prize.label,
    'prize_type', v_prize.prize_type, 'amount', v_prize.amount,
    'rarity', v_prize.rarity
  );
END;
$$;

REVOKE ALL ON FUNCTION public.grant_scratch_card(TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.reveal_scratch_card(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.grant_scratch_card(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reveal_scratch_card(UUID) TO authenticated;

INSERT INTO public.scratch_card_prizes (label, prize_type, amount, weight, rarity) VALUES
  ('Tente novamente', 'nothing', 0, 3000, 'common'),
  ('10 moedas', 'coins', 10, 3000, 'common'),
  ('25 moedas', 'coins', 25, 2000, 'common'),
  ('50 XP', 'xp', 50, 1200, 'rare'),
  ('100 moedas', 'coins', 100, 600, 'rare'),
  ('250 XP', 'xp', 250, 170, 'epic'),
  ('500 moedas', 'coins', 500, 30, 'legendary');