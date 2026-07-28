-- 1. Fila de push (outbox pattern) --------------------------------------
CREATE TABLE public.push_outbox (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  url TEXT,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  dedupe_key TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','processing','sent','failed','skipped')),
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.push_outbox TO authenticated;
GRANT ALL ON public.push_outbox TO service_role;

ALTER TABLE public.push_outbox ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view push outbox"
  ON public.push_outbox FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_push_outbox_pending
  ON public.push_outbox (created_at)
  WHERE status = 'pending';

CREATE TRIGGER push_outbox_updated_at
  BEFORE UPDATE ON public.push_outbox
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 2. Enfileiramento idempotente ------------------------------------------
CREATE OR REPLACE FUNCTION public.enqueue_push(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_dedupe_key TEXT,
  p_url TEXT DEFAULT NULL,
  p_data JSONB DEFAULT '{}'::jsonb
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_inserted UUID;
BEGIN
  IF p_user_id IS NULL OR coalesce(trim(p_dedupe_key), '') = '' THEN
    RETURN false;
  END IF;

  -- Preferência do usuário é respeitada na origem: nada entra na fila à toa.
  IF NOT public.user_wants_push_notification(p_user_id, p_type) THEN
    RETURN false;
  END IF;

  INSERT INTO public.push_outbox (user_id, type, title, message, url, data, dedupe_key)
  VALUES (p_user_id, p_type, left(p_title, 120), left(p_message, 400), p_url,
          coalesce(p_data, '{}'::jsonb), p_dedupe_key)
  ON CONFLICT (dedupe_key) DO NOTHING
  RETURNING id INTO v_inserted;

  RETURN v_inserted IS NOT NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.enqueue_push(uuid, text, text, text, text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.enqueue_push(uuid, text, text, text, text, text, jsonb) TO service_role;

-- 3. Apuração de leilão passa a enfileirar push ---------------------------
CREATE OR REPLACE FUNCTION public.settle_auction(p_auction_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_auction public.auctions%ROWTYPE;
  v_winner public.auction_bids%ROWTYPE;
  v_refunded INTEGER := 0;
  v_stock INTEGER;
  v_delivered BOOLEAN := false;
  v_notified INTEGER := 0;
  v_queued INTEGER := 0;
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

    IF public.user_wants_in_app_notification(r.user_id, 'auction') THEN
      INSERT INTO public.notifications (user_id, type, title, message, data)
      VALUES (r.user_id, 'auction',
              'Leilão encerrado',
              'Você não venceu "' || v_auction.title || '". Suas ' || r.escrow_coins || ' moedas foram devolvidas.',
              jsonb_build_object('auction_id', p_auction_id, 'outcome', 'refunded', 'refunded_amount', r.escrow_coins));
      v_notified := v_notified + 1;
    END IF;

    IF public.enqueue_push(
      r.user_id, 'auction', 'Leilão encerrado',
      'Você não venceu "' || v_auction.title || '". Suas ' || r.escrow_coins || ' moedas foram devolvidas.',
      'auction:' || p_auction_id::text || ':' || r.user_id::text || ':refunded',
      '/leilao',
      jsonb_build_object('auction_id', p_auction_id, 'outcome', 'refunded')
    ) THEN
      v_queued := v_queued + 1;
    END IF;
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
        UPDATE public.profiles SET coins = coins + v_winner.escrow_coins WHERE id = v_winner.user_id;
        UPDATE public.auction_bids SET status = 'refunded', escrow_coins = 0 WHERE id = v_winner.id;
        v_refunded := v_refunded + 1;

        IF public.user_wants_in_app_notification(v_winner.user_id, 'auction') THEN
          INSERT INTO public.notifications (user_id, type, title, message, data)
          VALUES (v_winner.user_id, 'auction',
                  'Item esgotado no leilão',
                  'O item de "' || v_auction.title || '" ficou indisponível. Suas ' || v_winner.escrow_coins || ' moedas foram devolvidas.',
                  jsonb_build_object('auction_id', p_auction_id, 'outcome', 'stock_unavailable', 'refunded_amount', v_winner.escrow_coins));
          v_notified := v_notified + 1;
        END IF;

        IF public.enqueue_push(
          v_winner.user_id, 'auction', 'Item esgotado no leilão',
          'O item de "' || v_auction.title || '" ficou indisponível. Suas moedas foram devolvidas.',
          'auction:' || p_auction_id::text || ':' || v_winner.user_id::text || ':stock_unavailable',
          '/leilao',
          jsonb_build_object('auction_id', p_auction_id, 'outcome', 'stock_unavailable')
        ) THEN
          v_queued := v_queued + 1;
        END IF;

        PERFORM public.log_auction_admin_event(p_auction_id, 'stock_unavailable', jsonb_build_object(
          'reward_id', v_auction.reward_id, 'winner_id', v_winner.user_id, 'refunded_amount', v_winner.escrow_coins
        ));
      END IF;
    ELSE
      v_delivered := true;
    END IF;

    IF v_delivered THEN
      IF public.user_wants_in_app_notification(v_winner.user_id, 'auction') THEN
        INSERT INTO public.notifications (user_id, type, title, message, data)
        VALUES (v_winner.user_id, 'auction',
                'Você venceu o leilão!',
                'Arremate confirmado em "' || v_auction.title || '" por ' || v_winner.amount || ' moedas.' ||
                CASE WHEN v_auction.reward_id IS NOT NULL THEN ' O item já foi reservado para você.' ELSE '' END,
                jsonb_build_object('auction_id', p_auction_id, 'outcome', 'won', 'winning_bid', v_winner.amount,
                                   'reward_id', v_auction.reward_id));
        v_notified := v_notified + 1;
      END IF;

      IF public.enqueue_push(
        v_winner.user_id, 'auction', 'Você venceu o leilão!',
        'Arremate confirmado em "' || v_auction.title || '" por ' || v_winner.amount || ' moedas.',
        'auction:' || p_auction_id::text || ':' || v_winner.user_id::text || ':won',
        '/leilao',
        jsonb_build_object('auction_id', p_auction_id, 'outcome', 'won')
      ) THEN
        v_queued := v_queued + 1;
      END IF;
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
    'refunded', v_refunded,
    'notified', v_notified,
    'push_queued', v_queued
  ));

  RETURN jsonb_build_object(
    'success', true, 'replayed', false,
    'winner_id', CASE WHEN v_delivered THEN v_winner.user_id ELSE NULL END,
    'winning_bid', CASE WHEN v_delivered THEN v_winner.amount ELSE NULL END,
    'refunded', v_refunded,
    'notified', v_notified,
    'push_queued', v_queued
  );
END;
$function$;

-- 4. Processamento automático da fila -------------------------------------
SELECT cron.schedule(
  'push-outbox-dispatcher',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://awzhgfmqwddzgbqzqusc.supabase.co/functions/v1/push-outbox-dispatcher',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := '{}'::jsonb
  );
  $$
);