CREATE OR REPLACE FUNCTION public.get_auction_summary(p_auction_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_user UUID := auth.uid(); v_auction public.auctions%ROWTYPE; v_my public.auction_bids%ROWTYPE;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'unauthenticated'); END IF;
  SELECT * INTO v_auction FROM public.auctions WHERE id = p_auction_id;
  IF NOT FOUND OR (v_auction.status = 'draft' AND NOT public.has_role(v_user, 'admin')) THEN RETURN jsonb_build_object('success', false, 'reason', 'not_found'); END IF;
  SELECT * INTO v_my FROM public.auction_bids WHERE auction_id = p_auction_id AND user_id = v_user;
  RETURN jsonb_build_object('success', true, 'id', v_auction.id, 'status', v_auction.status, 'ends_at', v_auction.ends_at, 'starting_bid', v_auction.starting_bid, 'min_increment', v_auction.min_increment, 'participants', (SELECT count(*) FROM public.auction_bids WHERE auction_id = p_auction_id AND status <> 'refunded'), 'my_bid', v_my.amount, 'my_status', v_my.status, 'min_next_bid', GREATEST(v_auction.starting_bid, COALESCE(v_my.amount, 0) + CASE WHEN v_my.id IS NULL THEN 0 ELSE v_auction.min_increment END), 'winner_id', CASE WHEN v_auction.status = 'closed' THEN v_auction.winner_id END, 'winning_bid', CASE WHEN v_auction.status = 'closed' THEN v_auction.winning_bid END);
END; $function$
