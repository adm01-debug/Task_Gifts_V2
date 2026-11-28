CREATE OR REPLACE FUNCTION public.place_auction_bid(p_auction_id uuid, p_amount integer, p_dedupe_key text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user UUID := auth.uid();
  v_auction public.auctions%ROWTYPE;
  v_bid public.auction_bids%ROWTYPE;
  v_delta INTEGER; v_coins INTEGER; v_min INTEGER;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'unauthenticated'); END IF;
  IF p_amount IS NULL OR p_amount < 1 OR p_amount > 1000000 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_amount');
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_auction_id::text, 42));
  SELECT * INTO v_auction FROM public.auctions WHERE id = p_auction_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'reason', 'not_found'); END IF;
  IF v_auction.status <> 'active' OR now() < v_auction.starts_at OR now() >= v_auction.ends_at THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_open');
  END IF;
  SELECT * INTO v_bid FROM public.auction_bids WHERE auction_id = p_auction_id AND user_id = v_user FOR UPDATE;
  IF FOUND AND p_dedupe_key IS NOT NULL AND v_bid.dedupe_key = p_dedupe_key THEN
    RETURN jsonb_build_object('success', true, 'replayed', true, 'amount', v_bid.amount, 'escrow', v_bid.escrow_coins);
  END IF;
  v_min := GREATEST(v_auction.starting_bid,
    COALESCE(v_bid.amount, 0) + CASE WHEN v_bid.id IS NULL THEN 0 ELSE v_auction.min_increment END);
  IF p_amount < v_min THEN
    RETURN jsonb_build_object('success', false, 'reason', 'below_minimum', 'min_required', v_min);
  END IF;
  v_delta := p_amount - COALESCE(v_bid.escrow_coins, 0);
  SELECT coins INTO v_coins FROM public.profiles WHERE id = v_user FOR UPDATE;
  IF v_coins IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'profile_missing'); END IF;
  IF v_coins < v_delta THEN
    RETURN jsonb_build_object('success', false, 'reason', 'insufficient_coins', 'required', v_delta, 'balance', v_coins);
  END IF;
  UPDATE public.profiles SET coins = coins - v_delta WHERE id = v_user;
  IF v_bid.id IS NULL THEN
    INSERT INTO public.auction_bids (auction_id, user_id, amount, escrow_coins, dedupe_key)
    VALUES (p_auction_id, v_user, p_amount, p_amount, p_dedupe_key);
    UPDATE public.auctions SET total_bids = total_bids + 1 WHERE id = p_auction_id;
  ELSE
    UPDATE public.auction_bids SET amount=p_amount, escrow_coins=p_amount, dedupe_key=p_dedupe_key, status='active' WHERE id = v_bid.id;
  END IF;
  RETURN jsonb_build_object('success', true, 'replayed', false, 'amount', p_amount, 'escrow', p_amount, 'balance', v_coins - v_delta);
END; $function$
