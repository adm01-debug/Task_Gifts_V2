CREATE OR REPLACE FUNCTION public.publish_auction(p_auction_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_auction public.auctions%ROWTYPE;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN RAISE EXCEPTION 'forbidden'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_auction_id::text, 42));
  SELECT * INTO v_auction FROM public.auctions WHERE id = p_auction_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'reason', 'not_found'); END IF;
  IF v_auction.status = 'active' THEN RETURN jsonb_build_object('success', true, 'replayed', true); END IF;
  IF v_auction.status <> 'draft' THEN RETURN jsonb_build_object('success', false, 'reason', 'not_draft'); END IF;
  IF v_auction.ends_at <= now() THEN RETURN jsonb_build_object('success', false, 'reason', 'window_expired'); END IF;
  IF v_auction.reward_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.shop_rewards WHERE id = v_auction.reward_id AND is_active = true) THEN RETURN jsonb_build_object('success', false, 'reason', 'reward_unavailable'); END IF;
  UPDATE public.auctions SET status = 'active' WHERE id = p_auction_id;
  PERFORM public.log_auction_admin_event(p_auction_id, 'published', jsonb_build_object('ends_at', v_auction.ends_at, 'reward_id', v_auction.reward_id));
  RETURN jsonb_build_object('success', true, 'replayed', false);
END; $function$
