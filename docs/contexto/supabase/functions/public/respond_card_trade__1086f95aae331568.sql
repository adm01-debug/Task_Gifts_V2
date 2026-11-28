CREATE OR REPLACE FUNCTION public.respond_card_trade(p_trade_id uuid, p_action text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_user UUID := auth.uid(); v_trade public.card_trades%ROWTYPE; v_offer_qty INTEGER; v_req_qty INTEGER;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  IF p_action NOT IN ('accept','decline','cancel') THEN RAISE EXCEPTION 'ação inválida'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext('card_trade:' || p_trade_id::text));
  SELECT * INTO v_trade FROM public.card_trades WHERE id = p_trade_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'reason', 'not_found'); END IF;
  IF v_trade.status <> 'pending' THEN RETURN jsonb_build_object('success', false, 'reason', 'not_pending'); END IF;
  IF v_trade.expires_at <= now() THEN UPDATE public.card_trades SET status = 'expired', resolved_at = now() WHERE id = v_trade.id; RETURN jsonb_build_object('success', false, 'reason', 'expired'); END IF;
  IF p_action = 'cancel' THEN IF v_trade.proposer_id <> v_user THEN RETURN jsonb_build_object('success', false, 'reason', 'forbidden'); END IF; UPDATE public.card_trades SET status = 'cancelled', resolved_at = now() WHERE id = v_trade.id; RETURN jsonb_build_object('success', true, 'status', 'cancelled'); END IF;
  IF v_trade.responder_id <> v_user THEN RETURN jsonb_build_object('success', false, 'reason', 'forbidden'); END IF;
  IF p_action = 'decline' THEN UPDATE public.card_trades SET status = 'declined', resolved_at = now() WHERE id = v_trade.id; RETURN jsonb_build_object('success', true, 'status', 'declined'); END IF;
  SELECT COALESCE(quantity, 0) INTO v_offer_qty FROM public.user_cards WHERE user_id = v_trade.proposer_id AND card_id = v_trade.offered_card_id FOR UPDATE;
  SELECT COALESCE(quantity, 0) INTO v_req_qty FROM public.user_cards WHERE user_id = v_trade.responder_id AND card_id = v_trade.requested_card_id FOR UPDATE;
  IF COALESCE(v_offer_qty, 0) < 2 OR COALESCE(v_req_qty, 0) < 2 THEN RETURN jsonb_build_object('success', false, 'reason', 'stale_inventory'); END IF;
  UPDATE public.user_cards SET quantity = quantity - 1, updated_at = now() WHERE user_id = v_trade.proposer_id AND card_id = v_trade.offered_card_id;
  UPDATE public.user_cards SET quantity = quantity - 1, updated_at = now() WHERE user_id = v_trade.responder_id AND card_id = v_trade.requested_card_id;
  INSERT INTO public.user_cards (user_id, card_id, quantity) VALUES (v_trade.responder_id, v_trade.offered_card_id, 1) ON CONFLICT (user_id, card_id) DO UPDATE SET quantity = public.user_cards.quantity + 1, updated_at = now();
  INSERT INTO public.user_cards (user_id, card_id, quantity) VALUES (v_trade.proposer_id, v_trade.requested_card_id, 1) ON CONFLICT (user_id, card_id) DO UPDATE SET quantity = public.user_cards.quantity + 1, updated_at = now();
  UPDATE public.card_trades SET status = 'accepted', resolved_at = now() WHERE id = v_trade.id;
  RETURN jsonb_build_object('success', true, 'status', 'accepted');
END; $function$
