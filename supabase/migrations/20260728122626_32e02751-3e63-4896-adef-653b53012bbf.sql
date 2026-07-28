-- =====================================================================
-- Álbum de Cartas — Recompensas de coleção (marcos 25/50/75/100%)
--
-- Regras espelhadas em src/lib/cardSetRewards.ts:
--  * valor do conjunto = soma dos valores de raridade das cartas ATIVAS
--  * moedas totais = valor * 5 ; xp total = valor * 3
--  * divisão em marcos por maior-resto (10/20/30/40%), soma EXATA do total
--  * marco atingido quando distintas*100 >= marco*total (aritmética inteira)
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.card_set_claims (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  set_code      TEXT NOT NULL,
  milestone     SMALLINT NOT NULL CHECK (milestone IN (25, 50, 75, 100)),
  coins_awarded INTEGER NOT NULL DEFAULT 0 CHECK (coins_awarded >= 0),
  xp_awarded    INTEGER NOT NULL DEFAULT 0 CHECK (xp_awarded >= 0),
  cards_owned   INTEGER NOT NULL DEFAULT 0 CHECK (cards_owned >= 0),
  cards_total   INTEGER NOT NULL DEFAULT 0 CHECK (cards_total >= 0),
  dedupe_key    TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT card_set_claims_unique UNIQUE (user_id, set_code, milestone),
  CONSTRAINT card_set_claims_dedupe_unique UNIQUE (dedupe_key)
);

CREATE INDEX IF NOT EXISTS idx_card_set_claims_user ON public.card_set_claims (user_id, set_code);

GRANT SELECT ON public.card_set_claims TO authenticated;
GRANT ALL ON public.card_set_claims TO service_role;

ALTER TABLE public.card_set_claims ENABLE ROW LEVEL SECURITY;

-- Leitura estritamente própria. Escrita: nenhuma policy — só a RPC
-- SECURITY DEFINER credita, impedindo que o cliente forje um resgate.
CREATE POLICY "own_card_set_claims_select"
  ON public.card_set_claims FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP TRIGGER IF EXISTS set_card_set_claims_updated_at ON public.card_set_claims;
CREATE TRIGGER set_card_set_claims_updated_at
  BEFORE UPDATE ON public.card_set_claims
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------
-- Núcleo compartilhado: progresso do conjunto + divisão por marcos
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._card_rarity_value(p_rarity TEXT)
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE p_rarity
    WHEN 'common'    THEN 1
    WHEN 'rare'      THEN 4
    WHEN 'epic'      THEN 12
    WHEN 'legendary' THEN 40
    ELSE 0
  END;
$$;

-- Divisão por maior-resto: garante soma exata (nenhuma moeda criada/perdida).
CREATE OR REPLACE FUNCTION public._card_set_milestone_split(p_total INTEGER)
RETURNS TABLE (milestone SMALLINT, amount INTEGER)
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  v_total   INTEGER := GREATEST(COALESCE(p_total, 0), 0);
  v_shares  NUMERIC[] := ARRAY[0.10, 0.20, 0.30, 0.40];
  v_marks   SMALLINT[] := ARRAY[25, 50, 75, 100]::SMALLINT[];
  v_floor   INTEGER[] := ARRAY[0,0,0,0];
  v_rest    NUMERIC[] := ARRAY[0,0,0,0];
  v_sum     INTEGER := 0;
  v_left    INTEGER;
  i         INTEGER;
  v_best    INTEGER;
  j         INTEGER;
BEGIN
  FOR i IN 1..4 LOOP
    v_floor[i] := FLOOR(v_total * v_shares[i]);
    v_rest[i]  := (v_total * v_shares[i]) - v_floor[i];
    v_sum      := v_sum + v_floor[i];
  END LOOP;

  v_left := v_total - v_sum;
  WHILE v_left > 0 LOOP
    -- Maior resto; empate resolvido pelo marco mais alto (curva crescente).
    v_best := 1;
    FOR j IN 2..4 LOOP
      IF v_rest[j] >= v_rest[v_best] THEN
        v_best := j;
      END IF;
    END LOOP;
    v_floor[v_best] := v_floor[v_best] + 1;
    v_rest[v_best]  := -1;
    v_left := v_left - 1;
  END LOOP;

  FOR i IN 1..4 LOOP
    milestone := v_marks[i];
    amount    := v_floor[i];
    RETURN NEXT;
  END LOOP;
END;
$$;

-- ---------------------------------------------------------------------
-- Leitura: progresso + estado de cada marco para o usuário autenticado
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_card_set_rewards()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_out  JSONB;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '28000';
  END IF;

  WITH sets AS (
    SELECT
      d.set_code,
      COUNT(*)::INTEGER AS total_cards,
      COUNT(*) FILTER (WHERE uc.quantity > 0)::INTEGER AS owned_cards,
      SUM(public._card_rarity_value(d.rarity))::INTEGER AS set_value
    FROM public.card_definitions d
    LEFT JOIN public.user_cards uc
      ON uc.card_id = d.id AND uc.user_id = v_user
    WHERE d.is_active
    GROUP BY d.set_code
  ),
  expanded AS (
    SELECT
      s.set_code, s.total_cards, s.owned_cards, s.set_value,
      c.milestone,
      c.amount AS coins,
      x.amount AS xp,
      CEIL((s.total_cards * c.milestone)::NUMERIC / 100)::INTEGER AS cards_required,
      (s.owned_cards * 100 >= c.milestone * s.total_cards) AS reached,
      (cl.id IS NOT NULL) AS claimed
    FROM sets s
    CROSS JOIN LATERAL public._card_set_milestone_split(s.set_value * 5) c
    JOIN LATERAL public._card_set_milestone_split(s.set_value * 3) x
      ON x.milestone = c.milestone
    LEFT JOIN public.card_set_claims cl
      ON cl.user_id = v_user AND cl.set_code = s.set_code AND cl.milestone = c.milestone
  )
  SELECT COALESCE(jsonb_agg(row_to_json(t)::JSONB ORDER BY t.set_code), '[]'::JSONB)
    INTO v_out
  FROM (
    SELECT
      e.set_code,
      MAX(e.total_cards) AS total_cards,
      MAX(e.owned_cards) AS owned_cards,
      MAX(e.set_value)   AS set_value,
      jsonb_agg(
        jsonb_build_object(
          'milestone', e.milestone,
          'coins', e.coins,
          'xp', e.xp,
          'cards_required', e.cards_required,
          'reached', e.reached,
          'claimed', e.claimed,
          'claimable', (e.reached AND NOT e.claimed)
        ) ORDER BY e.milestone
      ) AS milestones
    FROM expanded e
    GROUP BY e.set_code
  ) t;

  RETURN v_out;
END;
$$;

REVOKE ALL ON FUNCTION public.get_card_set_rewards() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_card_set_rewards() TO authenticated;

-- ---------------------------------------------------------------------
-- Resgate: revalida posse no servidor, credita e notifica (idempotente)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.claim_card_set_reward(
  p_set_code  TEXT,
  p_milestone SMALLINT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user        UUID := auth.uid();
  v_total       INTEGER;
  v_owned       INTEGER;
  v_value       INTEGER;
  v_coins       INTEGER;
  v_xp          INTEGER;
  v_dedupe      TEXT;
  v_existing    public.card_set_claims%ROWTYPE;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '28000';
  END IF;

  IF p_milestone IS NULL OR p_milestone NOT IN (25, 50, 75, 100) THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_milestone');
  END IF;

  IF p_set_code IS NULL OR length(trim(p_set_code)) = 0 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'unknown_set');
  END IF;

  v_dedupe := 'card_set:' || v_user::TEXT || ':' || p_set_code || ':' || p_milestone::TEXT;

  -- Trava por (usuário, conjunto): serializa duplo clique e retries paralelos.
  PERFORM pg_advisory_xact_lock(hashtext('card_set_claim'), hashtext(v_dedupe));

  SELECT * INTO v_existing
  FROM public.card_set_claims
  WHERE user_id = v_user AND set_code = p_set_code AND milestone = p_milestone;

  IF FOUND THEN
    -- Idempotente: devolve o mesmo resultado, sem creditar de novo.
    RETURN jsonb_build_object(
      'success', true,
      'replayed', true,
      'coins', v_existing.coins_awarded,
      'xp', v_existing.xp_awarded
    );
  END IF;

  SELECT
    COUNT(*)::INTEGER,
    COUNT(*) FILTER (WHERE uc.quantity > 0)::INTEGER,
    COALESCE(SUM(public._card_rarity_value(d.rarity)), 0)::INTEGER
  INTO v_total, v_owned, v_value
  FROM public.card_definitions d
  LEFT JOIN public.user_cards uc
    ON uc.card_id = d.id AND uc.user_id = v_user
  WHERE d.is_active AND d.set_code = p_set_code;

  IF v_total IS NULL OR v_total = 0 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'empty_set');
  END IF;

  IF v_owned * 100 < p_milestone * v_total THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_reached');
  END IF;

  SELECT amount INTO v_coins
  FROM public._card_set_milestone_split(v_value * 5)
  WHERE milestone = p_milestone;

  SELECT amount INTO v_xp
  FROM public._card_set_milestone_split(v_value * 3)
  WHERE milestone = p_milestone;

  v_coins := GREATEST(COALESCE(v_coins, 0), 0);
  v_xp    := GREATEST(COALESCE(v_xp, 0), 0);

  INSERT INTO public.card_set_claims
    (user_id, set_code, milestone, coins_awarded, xp_awarded, cards_owned, cards_total, dedupe_key)
  VALUES
    (v_user, p_set_code, p_milestone, v_coins, v_xp, v_owned, v_total, v_dedupe)
  ON CONFLICT (dedupe_key) DO NOTHING;

  IF NOT FOUND THEN
    -- Corrida vencida por outra transação: nada a creditar.
    RETURN jsonb_build_object('success', true, 'replayed', true, 'coins', 0, 'xp', 0);
  END IF;

  UPDATE public.profiles
     SET coins = coins + v_coins,
         xp    = xp + v_xp
   WHERE id = v_user;

  PERFORM public.enqueue_push(
    p_user_id   := v_user,
    p_type      := 'card_set_reward',
    p_title     := 'Marco de coleção conquistado!',
    p_message    := 'Você completou ' || p_milestone::TEXT || '% da coleção ' || p_set_code ||
                    ' e ganhou ' || v_coins::TEXT || ' moedas.',
    p_dedupe_key := v_dedupe,
    p_url        := '/album',
    p_data       := jsonb_build_object('set_code', p_set_code, 'milestone', p_milestone)
  );

  RETURN jsonb_build_object(
    'success', true,
    'replayed', false,
    'coins', v_coins,
    'xp', v_xp,
    'cards_owned', v_owned,
    'cards_total', v_total
  );
END;
$$;

REVOKE ALL ON FUNCTION public.claim_card_set_reward(TEXT, SMALLINT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_card_set_reward(TEXT, SMALLINT) TO authenticated;

REVOKE ALL ON FUNCTION public._card_rarity_value(TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public._card_set_milestone_split(INTEGER) FROM PUBLIC, anon;