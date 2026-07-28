-- ============================================================
-- ÁLBUM DE CARTAS COLECIONÁVEIS (Trading Cards) — Onda 3
-- Sorteio e transferência SEMPRE server-side (SECURITY DEFINER).
-- ============================================================

-- 1) CATÁLOGO -------------------------------------------------
CREATE TABLE public.card_definitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  rarity TEXT NOT NULL CHECK (rarity IN ('common','rare','epic','legendary')),
  set_code TEXT NOT NULL DEFAULT 'S1',
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.card_definitions TO authenticated;
GRANT ALL ON public.card_definitions TO service_role;
ALTER TABLE public.card_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "card_definitions_select_auth" ON public.card_definitions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "card_definitions_admin_all" ON public.card_definitions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_card_definitions_active ON public.card_definitions (is_active, rarity);

-- 2) COLEÇÃO DO COLABORADOR -----------------------------------
CREATE TABLE public.user_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  card_id UUID NOT NULL REFERENCES public.card_definitions(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  first_obtained_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, card_id)
);

GRANT SELECT ON public.user_cards TO authenticated;
GRANT ALL ON public.user_cards TO service_role;
ALTER TABLE public.user_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_cards_select_own" ON public.user_cards
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE INDEX idx_user_cards_user ON public.user_cards (user_id, card_id);

-- 3) PACOTES ---------------------------------------------------
CREATE TABLE public.card_packs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('task','training','quest','campaign','manual','streak')),
  source_ref TEXT,
  dedupe_key TEXT NOT NULL,
  size INTEGER NOT NULL DEFAULT 5 CHECK (size BETWEEN 1 AND 20),
  status TEXT NOT NULL DEFAULT 'sealed' CHECK (status IN ('sealed','opened')),
  opened_at TIMESTAMPTZ,
  result JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, dedupe_key)
);

GRANT SELECT ON public.card_packs TO authenticated;
GRANT ALL ON public.card_packs TO service_role;
ALTER TABLE public.card_packs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "card_packs_select_own" ON public.card_packs
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "card_packs_admin_select" ON public.card_packs
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_card_packs_user_status ON public.card_packs (user_id, status, created_at DESC);

-- 4) TROCAS ----------------------------------------------------
CREATE TABLE public.card_trades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  proposer_id UUID NOT NULL,
  responder_id UUID NOT NULL,
  offered_card_id UUID NOT NULL REFERENCES public.card_definitions(id) ON DELETE CASCADE,
  requested_card_id UUID NOT NULL REFERENCES public.card_definitions(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','accepted','declined','cancelled','expired')),
  message TEXT,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT card_trades_distinct_users CHECK (proposer_id <> responder_id),
  CONSTRAINT card_trades_distinct_cards CHECK (offered_card_id <> requested_card_id)
);

GRANT SELECT ON public.card_trades TO authenticated;
GRANT ALL ON public.card_trades TO service_role;
ALTER TABLE public.card_trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "card_trades_select_involved" ON public.card_trades
  FOR SELECT TO authenticated
  USING (proposer_id = auth.uid() OR responder_id = auth.uid());

CREATE INDEX idx_card_trades_responder ON public.card_trades (responder_id, status, created_at DESC);
CREATE INDEX idx_card_trades_proposer ON public.card_trades (proposer_id, status, created_at DESC);

-- Triggers de updated_at
CREATE TRIGGER trg_card_definitions_updated BEFORE UPDATE ON public.card_definitions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_user_cards_updated BEFORE UPDATE ON public.user_cards
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_card_packs_updated BEFORE UPDATE ON public.card_packs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_card_trades_updated BEFORE UPDATE ON public.card_trades
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- RPCs
-- ============================================================

-- 5) CONCEDER PACOTE (idempotente por origem) -----------------
CREATE OR REPLACE FUNCTION public.grant_card_pack(
  p_source TEXT,
  p_source_ref TEXT DEFAULT NULL,
  p_size INTEGER DEFAULT 5,
  p_user_id UUID DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_actor UUID := auth.uid();
  v_target UUID;
  v_key TEXT;
  v_id UUID;
  v_size INTEGER := GREATEST(1, LEAST(COALESCE(p_size, 5), 20));
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  v_target := COALESCE(p_user_id, v_actor);
  -- Conceder pacote a terceiros é privilégio administrativo.
  IF v_target <> v_actor AND NOT public.has_role(v_actor, 'admin') THEN
    RAISE EXCEPTION 'Permissão negada';
  END IF;

  IF p_source NOT IN ('task','training','quest','campaign','manual','streak') THEN
    RAISE EXCEPTION 'origem inválida';
  END IF;

  v_key := 'pack:' || p_source || ':' || COALESCE(NULLIF(btrim(p_source_ref), ''), 'none');
  IF length(v_key) > 160 THEN
    RAISE EXCEPTION 'referência de origem muito longa';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('card_pack:' || v_target::text));

  SELECT id INTO v_id FROM public.card_packs
   WHERE user_id = v_target AND dedupe_key = v_key;
  IF FOUND THEN
    RETURN jsonb_build_object('success', true, 'replayed', true, 'pack_id', v_id);
  END IF;

  INSERT INTO public.card_packs (user_id, source, source_ref, dedupe_key, size)
  VALUES (v_target, p_source, NULLIF(btrim(p_source_ref), ''), v_key, v_size)
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('success', true, 'replayed', false, 'pack_id', v_id);
END;
$$;

-- 6) ABRIR PACOTE (sorteio server-side, não repetível) --------
CREATE OR REPLACE FUNCTION public.open_card_pack(p_pack_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_pack public.card_packs%ROWTYPE;
  v_total NUMERIC;
  v_roll NUMERIC;
  v_cursor NUMERIC;
  v_card RECORD;
  v_picked UUID;
  v_picked_rarity TEXT;
  v_i INTEGER;
  v_result JSONB := '[]'::jsonb;
  v_has_premium BOOLEAN := false;
  v_ids UUID[] := '{}';
  v_rarities TEXT[] := '{}';
  v_new BOOLEAN;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('card_pack_open:' || p_pack_id::text));

  SELECT * INTO v_pack FROM public.card_packs
   WHERE id = p_pack_id AND user_id = v_user FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_found');
  END IF;
  IF v_pack.status = 'opened' THEN
    -- Idempotência: reabrir devolve o mesmo resultado, nunca sorteia de novo.
    RETURN jsonb_build_object('success', true, 'replayed', true, 'cards', COALESCE(v_pack.result, '[]'::jsonb));
  END IF;

  SELECT SUM(CASE rarity WHEN 'common' THEN 1000 WHEN 'rare' THEN 250 WHEN 'epic' THEN 60 ELSE 8 END)
    INTO v_total FROM public.card_definitions WHERE is_active;
  IF v_total IS NULL OR v_total <= 0 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'no_cards');
  END IF;

  FOR v_i IN 1..v_pack.size LOOP
    v_roll := random() * v_total;
    v_cursor := 0;
    v_picked := NULL;
    FOR v_card IN
      SELECT id, rarity,
             CASE rarity WHEN 'common' THEN 1000 WHEN 'rare' THEN 250 WHEN 'epic' THEN 60 ELSE 8 END AS w
        FROM public.card_definitions WHERE is_active
       ORDER BY rarity, code
    LOOP
      v_cursor := v_cursor + v_card.w;
      IF v_cursor >= v_roll THEN
        v_picked := v_card.id;
        v_picked_rarity := v_card.rarity;
        EXIT;
      END IF;
    END LOOP;
    IF v_picked IS NOT NULL THEN
      v_ids := array_append(v_ids, v_picked);
      v_rarities := array_append(v_rarities, v_picked_rarity);
      IF v_picked_rarity <> 'common' THEN v_has_premium := true; END IF;
    END IF;
  END LOOP;

  -- Garantia: pelo menos uma carta rara+ por pacote, quando existir no catálogo.
  IF NOT v_has_premium AND array_length(v_ids, 1) IS NOT NULL THEN
    SELECT id, rarity INTO v_picked, v_picked_rarity
      FROM public.card_definitions
     WHERE is_active AND rarity <> 'common'
     ORDER BY random() LIMIT 1;
    IF v_picked IS NOT NULL THEN
      v_ids[array_length(v_ids, 1)] := v_picked;
      v_rarities[array_length(v_rarities, 1)] := v_picked_rarity;
    END IF;
  END IF;

  FOR v_i IN 1..COALESCE(array_length(v_ids, 1), 0) LOOP
    v_new := NOT EXISTS (
      SELECT 1 FROM public.user_cards WHERE user_id = v_user AND card_id = v_ids[v_i] AND quantity > 0
    );
    INSERT INTO public.user_cards (user_id, card_id, quantity)
    VALUES (v_user, v_ids[v_i], 1)
    ON CONFLICT (user_id, card_id)
    DO UPDATE SET quantity = public.user_cards.quantity + 1, updated_at = now();

    v_result := v_result || jsonb_build_object(
      'card_id', v_ids[v_i], 'rarity', v_rarities[v_i], 'is_new', v_new
    );
  END LOOP;

  UPDATE public.card_packs
     SET status = 'opened', opened_at = now(), result = v_result, updated_at = now()
   WHERE id = v_pack.id;

  RETURN jsonb_build_object('success', true, 'replayed', false, 'cards', v_result);
END;
$$;

-- 7) PROPOR TROCA ---------------------------------------------
CREATE OR REPLACE FUNCTION public.propose_card_trade(
  p_responder_id UUID,
  p_offered_card_id UUID,
  p_requested_card_id UUID,
  p_message TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_offer_qty INTEGER;
  v_req_qty INTEGER;
  v_offer_value INTEGER;
  v_req_value INTEGER;
  v_id UUID;
  v_value_of CONSTANT JSONB := '{"common":1,"rare":4,"epic":12,"legendary":40}'::jsonb;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  IF p_responder_id = v_user THEN
    RETURN jsonb_build_object('success', false, 'reason', 'same_user');
  END IF;
  IF p_offered_card_id = p_requested_card_id THEN
    RETURN jsonb_build_object('success', false, 'reason', 'same_card');
  END IF;

  SELECT (v_value_of ->> rarity)::int INTO v_offer_value
    FROM public.card_definitions WHERE id = p_offered_card_id AND is_active;
  SELECT (v_value_of ->> rarity)::int INTO v_req_value
    FROM public.card_definitions WHERE id = p_requested_card_id AND is_active;
  IF v_offer_value IS NULL OR v_req_value IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'card_unavailable');
  END IF;

  SELECT COALESCE(quantity, 0) INTO v_offer_qty FROM public.user_cards
   WHERE user_id = v_user AND card_id = p_offered_card_id;
  IF COALESCE(v_offer_qty, 0) < 2 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'offer_not_duplicate');
  END IF;

  SELECT COALESCE(quantity, 0) INTO v_req_qty FROM public.user_cards
   WHERE user_id = p_responder_id AND card_id = p_requested_card_id;
  IF COALESCE(v_req_qty, 0) < 2 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'request_not_duplicate');
  END IF;

  IF GREATEST(v_offer_value, v_req_value) > LEAST(v_offer_value, v_req_value) * 3 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'unfair');
  END IF;

  -- Uma proposta pendente por par de cartas evita spam na caixa do colega.
  IF EXISTS (
    SELECT 1 FROM public.card_trades
     WHERE proposer_id = v_user AND responder_id = p_responder_id
       AND offered_card_id = p_offered_card_id AND requested_card_id = p_requested_card_id
       AND status = 'pending' AND expires_at > now()
  ) THEN
    RETURN jsonb_build_object('success', false, 'reason', 'duplicate_proposal');
  END IF;

  INSERT INTO public.card_trades (proposer_id, responder_id, offered_card_id, requested_card_id, message)
  VALUES (v_user, p_responder_id, p_offered_card_id, p_requested_card_id, NULLIF(btrim(p_message), ''))
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('success', true, 'trade_id', v_id);
END;
$$;

-- 8) RESPONDER TROCA (swap atômico) ---------------------------
CREATE OR REPLACE FUNCTION public.respond_card_trade(p_trade_id UUID, p_action TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_trade public.card_trades%ROWTYPE;
  v_offer_qty INTEGER;
  v_req_qty INTEGER;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  IF p_action NOT IN ('accept','decline','cancel') THEN
    RAISE EXCEPTION 'ação inválida';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('card_trade:' || p_trade_id::text));

  SELECT * INTO v_trade FROM public.card_trades WHERE id = p_trade_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_found');
  END IF;
  IF v_trade.status <> 'pending' THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_pending');
  END IF;
  IF v_trade.expires_at <= now() THEN
    UPDATE public.card_trades SET status = 'expired', resolved_at = now() WHERE id = v_trade.id;
    RETURN jsonb_build_object('success', false, 'reason', 'expired');
  END IF;

  IF p_action = 'cancel' THEN
    IF v_trade.proposer_id <> v_user THEN
      RETURN jsonb_build_object('success', false, 'reason', 'forbidden');
    END IF;
    UPDATE public.card_trades SET status = 'cancelled', resolved_at = now() WHERE id = v_trade.id;
    RETURN jsonb_build_object('success', true, 'status', 'cancelled');
  END IF;

  IF v_trade.responder_id <> v_user THEN
    RETURN jsonb_build_object('success', false, 'reason', 'forbidden');
  END IF;

  IF p_action = 'decline' THEN
    UPDATE public.card_trades SET status = 'declined', resolved_at = now() WHERE id = v_trade.id;
    RETURN jsonb_build_object('success', true, 'status', 'declined');
  END IF;

  -- Revalida no momento do aceite: o estoque pode ter mudado desde a proposta.
  SELECT COALESCE(quantity, 0) INTO v_offer_qty FROM public.user_cards
   WHERE user_id = v_trade.proposer_id AND card_id = v_trade.offered_card_id FOR UPDATE;
  SELECT COALESCE(quantity, 0) INTO v_req_qty FROM public.user_cards
   WHERE user_id = v_trade.responder_id AND card_id = v_trade.requested_card_id FOR UPDATE;

  IF COALESCE(v_offer_qty, 0) < 2 OR COALESCE(v_req_qty, 0) < 2 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'stale_inventory');
  END IF;

  -- Swap atômico: as quatro linhas mudam na mesma transação ou nenhuma muda.
  UPDATE public.user_cards SET quantity = quantity - 1, updated_at = now()
   WHERE user_id = v_trade.proposer_id AND card_id = v_trade.offered_card_id;
  UPDATE public.user_cards SET quantity = quantity - 1, updated_at = now()
   WHERE user_id = v_trade.responder_id AND card_id = v_trade.requested_card_id;

  INSERT INTO public.user_cards (user_id, card_id, quantity)
  VALUES (v_trade.responder_id, v_trade.offered_card_id, 1)
  ON CONFLICT (user_id, card_id) DO UPDATE
    SET quantity = public.user_cards.quantity + 1, updated_at = now();

  INSERT INTO public.user_cards (user_id, card_id, quantity)
  VALUES (v_trade.proposer_id, v_trade.requested_card_id, 1)
  ON CONFLICT (user_id, card_id) DO UPDATE
    SET quantity = public.user_cards.quantity + 1, updated_at = now();

  UPDATE public.card_trades SET status = 'accepted', resolved_at = now() WHERE id = v_trade.id;

  RETURN jsonb_build_object('success', true, 'status', 'accepted');
END;
$$;

-- 9) EXPIRAÇÃO AUTOMÁTICA -------------------------------------
CREATE OR REPLACE FUNCTION public.expire_card_trades()
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v_count INTEGER;
BEGIN
  UPDATE public.card_trades
     SET status = 'expired', resolved_at = now(), updated_at = now()
   WHERE status = 'pending' AND expires_at <= now();
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- 10) BLINDAGEM DE EXECUÇÃO -----------------------------------
REVOKE ALL ON FUNCTION public.grant_card_pack(TEXT, TEXT, INTEGER, UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.open_card_pack(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.propose_card_trade(UUID, UUID, UUID, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.respond_card_trade(UUID, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.expire_card_trades() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.grant_card_pack(TEXT, TEXT, INTEGER, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.open_card_pack(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.propose_card_trade(UUID, UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.respond_card_trade(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.expire_card_trades() TO service_role;

SELECT cron.schedule(
  'expire-card-trades-daily',
  '15 3 * * *',
  $cron$SELECT public.expire_card_trades();$cron$
);