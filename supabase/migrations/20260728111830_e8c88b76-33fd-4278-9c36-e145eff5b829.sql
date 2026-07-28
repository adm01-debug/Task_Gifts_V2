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

        PERFORM public.log_auction_admin_event(p_auction_id, 'stock_unavailable', jsonb_build_object(
          'reward_id', v_auction.reward_id, 'winner_id', v_winner.user_id, 'refunded_amount', v_winner.escrow_coins
        ));
      END IF;
    ELSE
      v_delivered := true;
    END IF;

    IF v_delivered AND public.user_wants_in_app_notification(v_winner.user_id, 'auction') THEN
      INSERT INTO public.notifications (user_id, type, title, message, data)
      VALUES (v_winner.user_id, 'auction',
              'Você venceu o leilão!',
              'Arremate confirmado em "' || v_auction.title || '" por ' || v_winner.amount || ' moedas.' ||
              CASE WHEN v_auction.reward_id IS NOT NULL THEN ' O item já foi reservado para você.' ELSE '' END,
              jsonb_build_object('auction_id', p_auction_id, 'outcome', 'won', 'winning_bid', v_winner.amount,
                                 'reward_id', v_auction.reward_id));
      v_notified := v_notified + 1;
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
    'notified', v_notified
  ));

  RETURN jsonb_build_object(
    'success', true, 'replayed', false,
    'winner_id', CASE WHEN v_delivered THEN v_winner.user_id ELSE NULL END,
    'winning_bid', CASE WHEN v_delivered THEN v_winner.amount ELSE NULL END,
    'refunded', v_refunded,
    'notified', v_notified
  );
END;
$function$;