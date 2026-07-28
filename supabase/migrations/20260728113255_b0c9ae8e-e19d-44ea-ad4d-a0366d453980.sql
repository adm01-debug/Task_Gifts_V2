-- =====================================================================
-- Mercado de Previsões (parimutuel) — espelho SQL de src/lib/predictionMarket.ts
-- =====================================================================

CREATE TABLE public.prediction_markets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','open','locked','settled','voided')),
  min_stake integer NOT NULL DEFAULT 10 CHECK (min_stake >= 1),
  max_stake_per_user integer NOT NULL DEFAULT 0 CHECK (max_stake_per_user >= 0),
  rake_bps integer NOT NULL DEFAULT 0 CHECK (rake_bps BETWEEN 0 AND 2000),
  locks_at timestamptz NOT NULL,
  resolves_at timestamptz,
  winning_option_id uuid,
  total_pool integer NOT NULL DEFAULT 0 CHECK (total_pool >= 0),
  rake_collected integer NOT NULL DEFAULT 0 CHECK (rake_collected >= 0),
  settled_at timestamptz,
  settled_by uuid,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.prediction_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id uuid NOT NULL REFERENCES public.prediction_markets(id) ON DELETE CASCADE,
  label text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  pool integer NOT NULL DEFAULT 0 CHECK (pool >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.prediction_stakes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id uuid NOT NULL REFERENCES public.prediction_markets(id) ON DELETE CASCADE,
  option_id uuid NOT NULL REFERENCES public.prediction_options(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  amount integer NOT NULL CHECK (amount >= 1),
  payout integer,
  dedupe_key text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_prediction_options_market ON public.prediction_options(market_id, sort_order);
CREATE INDEX idx_prediction_stakes_market ON public.prediction_stakes(market_id);
CREATE INDEX idx_prediction_stakes_user ON public.prediction_stakes(user_id, created_at DESC);
CREATE UNIQUE INDEX idx_prediction_stakes_dedupe
  ON public.prediction_stakes(market_id, user_id, dedupe_key)
  WHERE dedupe_key IS NOT NULL;
CREATE INDEX idx_prediction_markets_status ON public.prediction_markets(status, locks_at DESC);

GRANT SELECT ON public.prediction_markets TO authenticated;
GRANT SELECT ON public.prediction_options TO authenticated;
GRANT SELECT ON public.prediction_stakes TO authenticated;
GRANT ALL ON public.prediction_markets TO service_role;
GRANT ALL ON public.prediction_options TO service_role;
GRANT ALL ON public.prediction_stakes TO service_role;

ALTER TABLE public.prediction_markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prediction_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prediction_stakes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mercados publicados são visíveis"
  ON public.prediction_markets FOR SELECT TO authenticated
  USING (status <> 'draft' OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins gerenciam mercados"
  ON public.prediction_markets FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Opções de mercados visíveis"
  ON public.prediction_options FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.prediction_markets m
    WHERE m.id = market_id
      AND (m.status <> 'draft' OR public.has_role(auth.uid(), 'admin'))
  ));

CREATE POLICY "Admins gerenciam opções"
  ON public.prediction_options FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Usuário vê os próprios aportes"
  ON public.prediction_stakes FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_prediction_markets_updated_at
  BEFORE UPDATE ON public.prediction_markets
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ---------------------------------------------------------------------
-- Aporte: validação + débito atômico sob advisory lock por usuário/mercado
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.place_prediction_stake(
  p_market_id uuid,
  p_option_id uuid,
  p_amount integer,
  p_dedupe_key text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_market public.prediction_markets%ROWTYPE;
  v_option public.prediction_options%ROWTYPE;
  v_existing_option uuid;
  v_user_total integer;
  v_balance integer;
  v_stake_id uuid;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'unauthenticated');
  END IF;

  IF p_dedupe_key IS NOT NULL THEN
    SELECT id INTO v_stake_id FROM public.prediction_stakes
      WHERE market_id = p_market_id AND user_id = v_user AND dedupe_key = p_dedupe_key;
    IF v_stake_id IS NOT NULL THEN
      RETURN jsonb_build_object('ok', true, 'duplicate', true, 'stake_id', v_stake_id);
    END IF;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(p_market_id::text || v_user::text, 0));

  SELECT * INTO v_market FROM public.prediction_markets WHERE id = p_market_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'market_not_found');
  END IF;
  IF v_market.status <> 'open' OR now() >= v_market.locks_at THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'market_closed');
  END IF;

  SELECT * INTO v_option FROM public.prediction_options
    WHERE id = p_option_id AND market_id = p_market_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'unknown_option');
  END IF;

  IF p_amount IS NULL OR p_amount < 1 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_amount');
  END IF;
  IF p_amount < v_market.min_stake THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'below_minimum');
  END IF;

  SELECT option_id INTO v_existing_option FROM public.prediction_stakes
    WHERE market_id = p_market_id AND user_id = v_user LIMIT 1;
  IF v_existing_option IS NOT NULL AND v_existing_option <> p_option_id THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'option_switch_forbidden');
  END IF;

  SELECT COALESCE(SUM(amount), 0) INTO v_user_total FROM public.prediction_stakes
    WHERE market_id = p_market_id AND user_id = v_user;
  IF v_market.max_stake_per_user > 0
     AND v_user_total + p_amount > v_market.max_stake_per_user THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'over_user_cap');
  END IF;

  SELECT coins INTO v_balance FROM public.profiles WHERE id = v_user FOR UPDATE;
  IF v_balance IS NULL OR v_balance < p_amount THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'insufficient_coins');
  END IF;

  UPDATE public.profiles SET coins = coins - p_amount WHERE id = v_user;

  INSERT INTO public.prediction_stakes (market_id, option_id, user_id, amount, dedupe_key)
  VALUES (p_market_id, p_option_id, v_user, p_amount, p_dedupe_key)
  RETURNING id INTO v_stake_id;

  UPDATE public.prediction_options SET pool = pool + p_amount WHERE id = p_option_id;
  UPDATE public.prediction_markets SET total_pool = total_pool + p_amount WHERE id = p_market_id;

  RETURN jsonb_build_object(
    'ok', true,
    'stake_id', v_stake_id,
    'new_balance', v_balance - p_amount,
    'user_total', v_user_total + p_amount
  );
END;
$$;

-- ---------------------------------------------------------------------
-- Apuração: parimutuel inteiro com resto determinístico (maior aporte primeiro)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.settle_prediction_market(
  p_market_id uuid,
  p_winning_option_id uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_market public.prediction_markets%ROWTYPE;
  v_total integer;
  v_winner_pool integer := 0;
  v_rake integer := 0;
  v_distributable integer := 0;
  v_refund boolean := false;
  v_assigned integer := 0;
  v_remainder integer := 0;
  v_row record;
  v_rank integer := 0;
  v_paid integer := 0;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(p_market_id::text, 1));

  SELECT * INTO v_market FROM public.prediction_markets WHERE id = p_market_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'market_not_found');
  END IF;
  IF v_market.status IN ('settled','voided') THEN
    RETURN jsonb_build_object('ok', true, 'already_settled', true);
  END IF;

  SELECT COALESCE(SUM(amount), 0) INTO v_total
    FROM public.prediction_stakes WHERE market_id = p_market_id;

  IF p_winning_option_id IS NOT NULL THEN
    SELECT COALESCE(SUM(amount), 0) INTO v_winner_pool
      FROM public.prediction_stakes
      WHERE market_id = p_market_id AND option_id = p_winning_option_id;
  END IF;

  -- Reembolso: anulado, opção inválida, sem vencedores ou pool 100% vencedor.
  v_refund := p_winning_option_id IS NULL
    OR NOT EXISTS (SELECT 1 FROM public.prediction_options
                   WHERE id = p_winning_option_id AND market_id = p_market_id)
    OR v_winner_pool = 0
    OR v_winner_pool >= v_total;

  IF v_refund THEN
    FOR v_row IN
      SELECT user_id, SUM(amount)::integer AS amount
        FROM public.prediction_stakes WHERE market_id = p_market_id
        GROUP BY user_id
    LOOP
      UPDATE public.profiles SET coins = coins + v_row.amount WHERE id = v_row.user_id;
      v_paid := v_paid + v_row.amount;
      PERFORM public.enqueue_push(
        v_row.user_id,
        'Mercado de previsões anulado',
        'Seu aporte de ' || v_row.amount || ' moedas foi devolvido integralmente.',
        '/previsoes',
        'prediction_refund:' || p_market_id::text || ':' || v_row.user_id::text
      );
    END LOOP;

    UPDATE public.prediction_stakes s
      SET payout = agg.amount
      FROM (SELECT user_id, SUM(amount)::integer AS amount
              FROM public.prediction_stakes WHERE market_id = p_market_id
              GROUP BY user_id) agg
      WHERE s.market_id = p_market_id AND s.user_id = agg.user_id
        AND s.id = (SELECT id FROM public.prediction_stakes x
                     WHERE x.market_id = p_market_id AND x.user_id = agg.user_id
                     ORDER BY x.created_at LIMIT 1);
    UPDATE public.prediction_stakes SET payout = COALESCE(payout, 0)
      WHERE market_id = p_market_id AND payout IS NULL;

    UPDATE public.prediction_markets
      SET status = CASE WHEN p_winning_option_id IS NULL THEN 'voided' ELSE 'settled' END,
          winning_option_id = p_winning_option_id,
          rake_collected = 0,
          settled_at = now(),
          settled_by = auth.uid()
      WHERE id = p_market_id;

    RETURN jsonb_build_object('ok', true, 'refunded', true, 'total', v_total, 'paid', v_paid, 'rake', 0);
  END IF;

  v_rake := floor(v_total * v_market.rake_bps / 10000.0)::integer;
  v_distributable := v_total - v_rake;

  CREATE TEMP TABLE tmp_prediction_payout ON COMMIT DROP AS
    SELECT user_id,
           SUM(amount)::integer AS stake,
           floor(v_distributable::numeric * SUM(amount) / v_winner_pool)::integer AS amount
      FROM public.prediction_stakes
      WHERE market_id = p_market_id AND option_id = p_winning_option_id
      GROUP BY user_id;

  SELECT COALESCE(SUM(amount), 0) INTO v_assigned FROM tmp_prediction_payout;
  v_remainder := v_distributable - v_assigned;

  -- Resto determinístico: maiores aportes primeiro, desempate por user_id.
  FOR v_row IN
    SELECT user_id FROM tmp_prediction_payout ORDER BY stake DESC, user_id ASC
  LOOP
    EXIT WHEN v_rank >= v_remainder;
    UPDATE tmp_prediction_payout SET amount = amount + 1 WHERE user_id = v_row.user_id;
    v_rank := v_rank + 1;
  END LOOP;

  FOR v_row IN SELECT user_id, stake, amount FROM tmp_prediction_payout LOOP
    UPDATE public.profiles SET coins = coins + v_row.amount WHERE id = v_row.user_id;
    v_paid := v_paid + v_row.amount;
    UPDATE public.prediction_stakes
      SET payout = CASE WHEN id = (SELECT x.id FROM public.prediction_stakes x
                                    WHERE x.market_id = p_market_id AND x.user_id = v_row.user_id
                                    ORDER BY x.created_at LIMIT 1)
                        THEN v_row.amount ELSE 0 END
      WHERE market_id = p_market_id AND user_id = v_row.user_id;
    PERFORM public.enqueue_push(
      v_row.user_id,
      'Você acertou a previsão!',
      'Recebeu ' || v_row.amount || ' moedas (aporte de ' || v_row.stake || ').',
      '/previsoes',
      'prediction_win:' || p_market_id::text || ':' || v_row.user_id::text
    );
  END LOOP;

  UPDATE public.prediction_stakes SET payout = 0
    WHERE market_id = p_market_id AND payout IS NULL;

  UPDATE public.prediction_markets
    SET status = 'settled',
        winning_option_id = p_winning_option_id,
        rake_collected = v_rake,
        settled_at = now(),
        settled_by = auth.uid()
    WHERE id = p_market_id;

  RETURN jsonb_build_object(
    'ok', true, 'refunded', false, 'total', v_total,
    'paid', v_paid, 'rake', v_rake,
    'conserved', (v_paid + v_rake) = v_total
  );
END;
$$;

REVOKE ALL ON FUNCTION public.place_prediction_stake(uuid, uuid, integer, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.settle_prediction_market(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.place_prediction_stake(uuid, uuid, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.settle_prediction_market(uuid, uuid) TO authenticated;