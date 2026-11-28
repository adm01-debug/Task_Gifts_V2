CREATE OR REPLACE FUNCTION public.propose_card_trade(p_responder_id uuid, p_offered_card_id uuid, p_requested_card_id uuid, p_message text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_user UUID := auth.uid(); v_offer_qty INTEGER; v_req_qty INTEGER; v_offer_value INTEGER; v_req_value INTEGER; v_id UUID; v_value_of CONSTANT JSONB := '{"common":1,"rare":4,"epic":12,"legendary":40}'::jsonb;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  IF p_responder_id = v_user THEN RETURN jsonb_build_object('success', false, 'reason', 'same_user'); END IF;
  IF p_offered_card_id = p_requested_card_id THEN RETURN jsonb_build_object('success', false, 'reason', 'same_card'); END IF;
  SELECT (v_value_of ->> rarity)::int INTO v_offer_value FROM public.card_definitions WHERE id = p_offered_card_id AND is_active;
  SELECT (v_value_of ->> rarity)::int INTO v_req_value FROM public.card_definitions WHERE id = p_requested_card_id AND is_active;
  IF v_offer_value IS NULL OR v_req_value IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'card_unavailable'); END IF;
  SELECT COALESCE(quantity, 0) INTO v_offer_qty FROM public.user_cards WHERE user_id = v_user AND card_id = p_offered_card_id;
  IF COALESCE(v_offer_qty, 0) < 2 THEN RETURN jsonb_build_object('success', false, 'reason', 'offer_not_duplicate'); END IF;
  SELECT COALESCE(quantity, 0) INTO v_req_qty FROM public.user_cards WHERE user_id = p_responder_id AND card_id = p_requested_card_id;
  IF COALESCE(v_req_qty, 0) < 2 THEN RETURN jsonb_build_object('success', false, 'reason', 'request_not_duplicate'); END IF;
  IF GREATEST(v_offer_value, v_req_value) > LEAST(v_offer_value, v_req_value) * 3 THEN RETURN jsonb_build_object('success', false, 'reason', 'unfair'); END IF;
  IF EXISTS (SELECT 1 FROM public.card_trades WHERE proposer_id = v_user AND responder_id = p_responder_id AND offered_card_id = p_offered_card_id AND requested_card_id = p_requested_card_id AND status = 'pending' AND expires_at > now()) THEN RETURN jsonb_build_object('success', false, 'reason', 'duplicate_proposal'); END IF;
  INSERT INTO public.card_trades (proposer_id, responder_id, offered_card_id, requested_card_id, message) VALUES (v_user, p_responder_id, p_offered_card_id, p_requested_card_id, NULLIF(btrim(p_message), '')) RETURNING id INTO v_id;
  RETURN jsonb_build_object('success', true, 'trade_id', v_id);
END; $function$
