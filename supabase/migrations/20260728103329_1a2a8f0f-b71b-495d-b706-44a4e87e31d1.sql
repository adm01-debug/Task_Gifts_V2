-- =====================================================================
-- LEILÃO DE RECOMPENSAS (sealed-bid / lance às cegas)
-- Toda a movimentação de moedas ocorre em RPC SECURITY DEFINER.
-- =====================================================================

CREATE TABLE public.auctions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reward_id UUID REFERENCES public.shop_rewards(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  starting_bid INTEGER NOT NULL DEFAULT 1 CHECK (starting_bid >= 1),
  min_increment INTEGER NOT NULL DEFAULT 1 CHECK (min_increment >= 1),
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','active','closed','cancelled')),
  winner_id UUID,
  winning_bid INTEGER,
  total_bids INTEGER NOT NULL DEFAULT 0,
  closed_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.auctions TO authenticated;
GRANT ALL ON public.auctions TO service_role;
ALTER TABLE public.auctions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auctions_select_published"
  ON public.auctions FOR SELECT TO authenticated
  USING (status <> 'draft' OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "auctions_admin_write"
  ON public.auctions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_auctions_status_ends ON public.auctions(status, ends_at DESC);
CREATE INDEX idx_auctions_reward ON public.auctions(reward_id);

CREATE TRIGGER trg_auctions_updated_at
  BEFORE UPDATE ON public.auctions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Validação temporal via trigger (CHECK precisa ser imutável).
CREATE OR REPLACE FUNCTION public.validate_auction_window()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.ends_at <= NEW.starts_at THEN
    RAISE EXCEPTION 'auction_window_invalid';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auctions_validate_window
  BEFORE INSERT OR UPDATE ON public.auctions
  FOR EACH ROW EXECUTE FUNCTION public.validate_auction_window();

-- ---------------------------------------------------------------------

CREATE TABLE public.auction_bids (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  auction_id UUID NOT NULL REFERENCES public.auctions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  amount INTEGER NOT NULL CHECK (amount >= 1),
  escrow_coins INTEGER NOT NULL DEFAULT 0 CHECK (escrow_coins >= 0),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','refunded','won')),
  dedupe_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (auction_id, user_id)
);

GRANT SELECT ON public.auction_bids TO authenticated;
GRANT ALL ON public.auction_bids TO service_role;
ALTER TABLE public.auction_bids ENABLE ROW LEVEL SECURITY;

-- Lance às cegas: cada participante enxerga somente o próprio lance.
CREATE POLICY "auction_bids_select_own"
  ON public.auction_bids FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Sem policies de INSERT/UPDATE/DELETE: escrita apenas via RPC SECURITY DEFINER.

CREATE UNIQUE INDEX idx_auction_bids_dedupe
  ON public.auction_bids(auction_id, user_id, dedupe_key)
  WHERE dedupe_key IS NOT NULL;
CREATE INDEX idx_auction_bids_auction_amount
  ON public.auction_bids(auction_id, amount DESC, created_at ASC);

CREATE TRIGGER trg_auction_bids_updated_at
  BEFORE UPDATE ON public.auction_bids
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================================
-- RPC: dar/aumentar lance (idempotente, com caução de moedas)
-- =====================================================================
CREATE OR REPLACE FUNCTION public.place_auction_bid(
  p_auction_id UUID,
  p_amount INTEGER,
  p_dedupe_key TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_auction public.auctions%ROWTYPE;
  v_bid public.auction_bids%ROWTYPE;
  v_delta INTEGER;
  v_coins INTEGER;
  v_min INTEGER;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'unauthenticated');
  END IF;

  IF p_amount IS NULL OR p_amount < 1 OR p_amount > 1000000 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_amount');
  END IF;

  -- Serializa por leilão para evitar corrida de caução.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_auction_id::text, 42));

  SELECT * INTO v_auction FROM public.auctions WHERE id = p_auction_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_found');
  END IF;

  IF v_auction.status <> 'active' OR now() < v_auction.starts_at OR now() >= v_auction.ends_at THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_open');
  END IF;

  SELECT * INTO v_bid
  FROM public.auction_bids
  WHERE auction_id = p_auction_id AND user_id = v_user
  FOR UPDATE;

  -- Retentativa idempotente: mesma chave devolve o mesmo estado sem cobrar de novo.
  IF FOUND AND p_dedupe_key IS NOT NULL AND v_bid.dedupe_key = p_dedupe_key THEN
    RETURN jsonb_build_object(
      'success', true, 'replayed', true,
      'amount', v_bid.amount, 'escrow', v_bid.escrow_coins
    );
  END IF;

  v_min := GREATEST(
    v_auction.starting_bid,
    COALESCE(v_bid.amount, 0) + CASE WHEN v_bid.id IS NULL THEN 0 ELSE v_auction.min_increment END
  );

  IF p_amount < v_min THEN
    RETURN jsonb_build_object('success', false, 'reason', 'below_minimum', 'min_required', v_min);
  END IF;

  v_delta := p_amount - COALESCE(v_bid.escrow_coins, 0);

  SELECT coins INTO v_coins FROM public.profiles WHERE id = v_user FOR UPDATE;
  IF v_coins IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'profile_missing');
  END IF;
  IF v_coins < v_delta THEN
    RETURN jsonb_build_object(
      'success', false, 'reason', 'insufficient_coins',
      'required', v_delta, 'balance', v_coins
    );
  END IF;

  UPDATE public.profiles SET coins = coins - v_delta WHERE id = v_user;

  IF v_bid.id IS NULL THEN
    INSERT INTO public.auction_bids (auction_id, user_id, amount, escrow_coins, dedupe_key)
    VALUES (p_auction_id, v_user, p_amount, p_amount, p_dedupe_key);
    UPDATE public.auctions SET total_bids = total_bids + 1 WHERE id = p_auction_id;
  ELSE
    UPDATE public.auction_bids
    SET amount = p_amount, escrow_coins = p_amount, dedupe_key = p_dedupe_key, status = 'active'
    WHERE id = v_bid.id;
  END IF;

  RETURN jsonb_build_object(
    'success', true, 'replayed', false,
    'amount', p_amount, 'escrow', p_amount,
    'balance', v_coins - v_delta
  );
END;
$$;

REVOKE ALL ON FUNCTION public.place_auction_bid(UUID, INTEGER, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.place_auction_bid(UUID, INTEGER, TEXT) TO authenticated;

-- =====================================================================
-- RPC interna: encerra um leilão (apura vencedor + estorna perdedores)
-- =====================================================================
CREATE OR REPLACE FUNCTION public.settle_auction(p_auction_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auction public.auctions%ROWTYPE;
  v_winner public.auction_bids%ROWTYPE;
  v_refunded INTEGER := 0;
  r RECORD;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_auction_id::text, 42));

  SELECT * INTO v_auction FROM public.auctions WHERE id = p_auction_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_found');
  END IF;
  IF v_auction.status IN ('closed','cancelled') THEN
    RETURN jsonb_build_object('success', true, 'replayed', true, 'winner_id', v_auction.winner_id);
  END IF;

  SELECT * INTO v_winner
  FROM public.auction_bids
  WHERE auction_id = p_auction_id AND status = 'active'
  ORDER BY amount DESC, created_at ASC
  LIMIT 1;

  -- Estorna todo mundo que não venceu.
  FOR r IN
    SELECT * FROM public.auction_bids
    WHERE auction_id = p_auction_id
      AND status = 'active'
      AND (v_winner.id IS NULL OR id <> v_winner.id)
  LOOP
    UPDATE public.profiles SET coins = coins + r.escrow_coins WHERE id = r.user_id;
    UPDATE public.auction_bids SET status = 'refunded', escrow_coins = 0 WHERE id = r.id;
    v_refunded := v_refunded + 1;
  END LOOP;

  IF v_winner.id IS NOT NULL THEN
    UPDATE public.auction_bids SET status = 'won' WHERE id = v_winner.id;

    -- Moedas já foram debitadas na caução: o resgate entra como pedido pendente.
    IF v_auction.reward_id IS NOT NULL THEN
      INSERT INTO public.shop_purchases (user_id, reward_id, status, quantity, total_coins, notes)
      VALUES (v_winner.user_id, v_auction.reward_id, 'pending', 1, v_winner.amount,
              'Resgate automático — leilão: ' || v_auction.title);
    END IF;
  END IF;

  UPDATE public.auctions
  SET status = 'closed',
      closed_at = now(),
      winner_id = v_winner.user_id,
      winning_bid = v_winner.amount
  WHERE id = p_auction_id;

  RETURN jsonb_build_object(
    'success', true, 'replayed', false,
    'winner_id', v_winner.user_id, 'winning_bid', v_winner.amount,
    'refunded', v_refunded
  );
END;
$$;

REVOKE ALL ON FUNCTION public.settle_auction(UUID) FROM PUBLIC, anon, authenticated;

-- Encerramento manual por admin
CREATE OR REPLACE FUNCTION public.close_auction(p_auction_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  RETURN public.settle_auction(p_auction_id);
END;
$$;

REVOKE ALL ON FUNCTION public.close_auction(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.close_auction(UUID) TO authenticated;

-- Cancelamento por admin: devolve tudo, sem vencedor.
CREATE OR REPLACE FUNCTION public.cancel_auction(p_auction_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_refunded INTEGER := 0;
  r RECORD;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(p_auction_id::text, 42));

  IF NOT EXISTS (
    SELECT 1 FROM public.auctions
    WHERE id = p_auction_id AND status NOT IN ('closed','cancelled')
  ) THEN
    RETURN jsonb_build_object('success', true, 'replayed', true);
  END IF;

  FOR r IN
    SELECT * FROM public.auction_bids WHERE auction_id = p_auction_id AND status = 'active'
  LOOP
    UPDATE public.profiles SET coins = coins + r.escrow_coins WHERE id = r.user_id;
    UPDATE public.auction_bids SET status = 'refunded', escrow_coins = 0 WHERE id = r.id;
    v_refunded := v_refunded + 1;
  END LOOP;

  UPDATE public.auctions
  SET status = 'cancelled', closed_at = now()
  WHERE id = p_auction_id;

  RETURN jsonb_build_object('success', true, 'refunded', v_refunded);
END;
$$;

REVOKE ALL ON FUNCTION public.cancel_auction(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancel_auction(UUID) TO authenticated;

-- Encerramento automático dos leilões vencidos (cron).
CREATE OR REPLACE FUNCTION public.close_expired_auctions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER := 0;
  r RECORD;
BEGIN
  FOR r IN
    SELECT id FROM public.auctions
    WHERE status = 'active' AND ends_at <= now()
    ORDER BY ends_at ASC
    LIMIT 200
  LOOP
    PERFORM public.settle_auction(r.id);
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.close_expired_auctions() FROM PUBLIC, anon, authenticated;

-- =====================================================================
-- RPC pública: resumo do leilão sem vazar lances alheios
-- =====================================================================
CREATE OR REPLACE FUNCTION public.get_auction_summary(p_auction_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_auction public.auctions%ROWTYPE;
  v_my public.auction_bids%ROWTYPE;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'unauthenticated');
  END IF;

  SELECT * INTO v_auction FROM public.auctions WHERE id = p_auction_id;
  IF NOT FOUND OR (v_auction.status = 'draft' AND NOT public.has_role(v_user, 'admin')) THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_found');
  END IF;

  SELECT * INTO v_my
  FROM public.auction_bids
  WHERE auction_id = p_auction_id AND user_id = v_user;

  RETURN jsonb_build_object(
    'success', true,
    'id', v_auction.id,
    'status', v_auction.status,
    'ends_at', v_auction.ends_at,
    'starting_bid', v_auction.starting_bid,
    'min_increment', v_auction.min_increment,
    'participants', (
      SELECT count(*) FROM public.auction_bids
      WHERE auction_id = p_auction_id AND status <> 'refunded'
    ),
    'my_bid', v_my.amount,
    'my_status', v_my.status,
    'min_next_bid', GREATEST(
      v_auction.starting_bid,
      COALESCE(v_my.amount, 0) + CASE WHEN v_my.id IS NULL THEN 0 ELSE v_auction.min_increment END
    ),
    -- Resultado só é revelado após o encerramento (lance às cegas).
    'winner_id', CASE WHEN v_auction.status = 'closed' THEN v_auction.winner_id END,
    'winning_bid', CASE WHEN v_auction.status = 'closed' THEN v_auction.winning_bid END
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_auction_summary(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_auction_summary(UUID) TO authenticated;