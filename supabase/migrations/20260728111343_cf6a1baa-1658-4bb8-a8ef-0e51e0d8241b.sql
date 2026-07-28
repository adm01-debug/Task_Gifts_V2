-- 1) Tabela de trilha auditável (append-only)
CREATE TABLE IF NOT EXISTS public.auction_admin_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  auction_id UUID REFERENCES public.auctions(id) ON DELETE SET NULL,
  actor_id UUID,
  action TEXT NOT NULL CHECK (action IN ('draft_created','published','settled','cancelled','stock_reserved','stock_unavailable')),
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auction_admin_events_auction ON public.auction_admin_events (auction_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auction_admin_events_created ON public.auction_admin_events (created_at DESC);

GRANT SELECT ON public.auction_admin_events TO authenticated;
GRANT ALL ON public.auction_admin_events TO service_role;

ALTER TABLE public.auction_admin_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auction_admin_events_admin_read" ON public.auction_admin_events;
CREATE POLICY "auction_admin_events_admin_read"
  ON public.auction_admin_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 2) Gravador interno (somente funções SECURITY DEFINER podem chamar)
CREATE OR REPLACE FUNCTION public.log_auction_admin_event(
  p_auction_id UUID,
  p_action TEXT,
  p_details JSONB DEFAULT '{}'::jsonb
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.auction_admin_events (auction_id, actor_id, action, details)
  VALUES (p_auction_id, auth.uid(), p_action, COALESCE(p_details, '{}'::jsonb));
END;
$$;

REVOKE ALL ON FUNCTION public.log_auction_admin_event(UUID, TEXT, JSONB) FROM PUBLIC, anon, authenticated;

-- 3) Criação de rascunho via RPC validada
CREATE OR REPLACE FUNCTION public.create_auction_draft(
  p_title TEXT,
  p_description TEXT,
  p_starting_bid INTEGER,
  p_min_increment INTEGER,
  p_starts_at TIMESTAMPTZ,
  p_ends_at TIMESTAMPTZ,
  p_reward_id UUID DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
  v_title TEXT := btrim(COALESCE(p_title, ''));
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF length(v_title) < 3 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_title');
  END IF;
  IF COALESCE(p_starting_bid, 0) < 1 OR COALESCE(p_min_increment, 0) < 1 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_economics');
  END IF;
  IF p_ends_at IS NULL OR p_starts_at IS NULL OR p_ends_at <= p_starts_at THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_window');
  END IF;
  IF p_reward_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.shop_rewards WHERE id = p_reward_id AND is_active = true
  ) THEN
    RETURN jsonb_build_object('success', false, 'reason', 'reward_unavailable');
  END IF;

  INSERT INTO public.auctions (title, description, starting_bid, min_increment, starts_at, ends_at, reward_id, status, created_by)
  VALUES (v_title, NULLIF(btrim(COALESCE(p_description, '')), ''), p_starting_bid, p_min_increment, p_starts_at, p_ends_at, p_reward_id, 'draft', auth.uid())
  RETURNING id INTO v_id;

  PERFORM public.log_auction_admin_event(v_id, 'draft_created', jsonb_build_object(
    'title', v_title, 'starting_bid', p_starting_bid, 'min_increment', p_min_increment,
    'starts_at', p_starts_at, 'ends_at', p_ends_at, 'reward_id', p_reward_id
  ));

  RETURN jsonb_build_object('success', true, 'id', v_id);
END;
$$;

REVOKE ALL ON FUNCTION public.create_auction_draft(TEXT, TEXT, INTEGER, INTEGER, TIMESTAMPTZ, TIMESTAMPTZ, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_auction_draft(TEXT, TEXT, INTEGER, INTEGER, TIMESTAMPTZ, TIMESTAMPTZ, UUID) TO authenticated;

-- 4) Publicação via RPC validada
CREATE OR REPLACE FUNCTION public.publish_auction(p_auction_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auction public.auctions%ROWTYPE;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(p_auction_id::text, 42));

  SELECT * INTO v_auction FROM public.auctions WHERE id = p_auction_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_found');
  END IF;
  IF v_auction.status = 'active' THEN
    RETURN jsonb_build_object('success', true, 'replayed', true);
  END IF;
  IF v_auction.status <> 'draft' THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_draft');
  END IF;
  IF v_auction.ends_at <= now() THEN
    RETURN jsonb_build_object('success', false, 'reason', 'window_expired');
  END IF;
  IF v_auction.reward_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.shop_rewards WHERE id = v_auction.reward_id AND is_active = true
  ) THEN
    RETURN jsonb_build_object('success', false, 'reason', 'reward_unavailable');
  END IF;

  UPDATE public.auctions SET status = 'active' WHERE id = p_auction_id;

  PERFORM public.log_auction_admin_event(p_auction_id, 'published', jsonb_build_object(
    'ends_at', v_auction.ends_at, 'reward_id', v_auction.reward_id
  ));

  RETURN jsonb_build_object('success', true, 'replayed', false);
END;
$$;

REVOKE ALL ON FUNCTION public.publish_auction(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.publish_auction(UUID) TO authenticated;

-- 5) Apuração: reserva de estoque + auditoria
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
  v_stock INTEGER;
  v_delivered BOOLEAN := false;
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

    IF v_auction.reward_id IS NOT NULL THEN
      SELECT stock INTO v_stock FROM public.shop_rewards WHERE id = v_auction.reward_id FOR UPDATE;

      IF v_stock IS NULL OR v_stock > 0 THEN
        IF v_stock IS NOT NULL THEN
          UPDATE public.shop_rewards SET stock = stock - 1 WHERE id = v_auction.reward_id;
        END IF;

        INSERT INTO public.shop_purchases (user_id, reward_id, status, quantity, total_coins, notes)
        VALUES (v_winner.user_id, v_auction.reward_id, 'pending', 1, v_winner.amount,
                'Resgate automático — leilão: ' || v_auction.title);
        v_delivered := true;

        PERFORM public.log_auction_admin_event(p_auction_id, 'stock_reserved', jsonb_build_object(
          'reward_id', v_auction.reward_id, 'winner_id', v_winner.user_id, 'amount', v_winner.amount
        ));
      ELSE
        -- Sem estoque: devolve a caução do vencedor em vez de prometer um item inexistente.
        UPDATE public.profiles SET coins = coins + v_winner.escrow_coins WHERE id = v_winner.user_id;
        UPDATE public.auction_bids SET status = 'refunded', escrow_coins = 0 WHERE id = v_winner.id;
        v_refunded := v_refunded + 1;

        PERFORM public.log_auction_admin_event(p_auction_id, 'stock_unavailable', jsonb_build_object(
          'reward_id', v_auction.reward_id, 'winner_id', v_winner.user_id, 'refunded_amount', v_winner.escrow_coins
        ));
      END IF;
    ELSE
      v_delivered := true;
    END IF;
  END IF;

  UPDATE public.auctions
  SET status = 'closed',
      closed_at = now(),
      winner_id = CASE WHEN v_delivered THEN v_winner.user_id ELSE NULL END,
      winning_bid = CASE WHEN v_delivered THEN v_winner.amount ELSE NULL END
  WHERE id = p_auction_id;

  PERFORM public.log_auction_admin_event(p_auction_id, 'settled', jsonb_build_object(
    'winner_id', CASE WHEN v_delivered THEN v_winner.user_id ELSE NULL END,
    'winning_bid', CASE WHEN v_delivered THEN v_winner.amount ELSE NULL END,
    'refunded', v_refunded
  ));

  RETURN jsonb_build_object(
    'success', true, 'replayed', false,
    'winner_id', CASE WHEN v_delivered THEN v_winner.user_id ELSE NULL END,
    'winning_bid', CASE WHEN v_delivered THEN v_winner.amount ELSE NULL END,
    'refunded', v_refunded
  );
END;
$$;

-- 6) Cancelamento auditável
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
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
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

  PERFORM public.log_auction_admin_event(p_auction_id, 'cancelled', jsonb_build_object('refunded', v_refunded));

  RETURN jsonb_build_object('success', true, 'refunded', v_refunded);
END;
$$;