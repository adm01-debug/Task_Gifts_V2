CREATE OR REPLACE FUNCTION public.cancel_auction(p_auction_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_refunded INTEGER := 0; r RECORD;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN RAISE EXCEPTION 'forbidden'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_auction_id::text, 42));
  IF NOT EXISTS (SELECT 1 FROM public.auctions WHERE id = p_auction_id AND status NOT IN ('closed','cancelled')) THEN RETURN jsonb_build_object('success', true, 'replayed', true); END IF;
  FOR r IN SELECT * FROM public.auction_bids WHERE auction_id = p_auction_id AND status = 'active' LOOP
    UPDATE public.profiles SET coins = coins + r.escrow_coins WHERE id = r.user_id;
    UPDATE public.auction_bids SET status = 'refunded', escrow_coins = 0 WHERE id = r.id;
    v_refunded := v_refunded + 1;
  END LOOP;
  UPDATE public.auctions SET status = 'cancelled', closed_at = now() WHERE id = p_auction_id;
  PERFORM public.log_auction_admin_event(p_auction_id, 'cancelled', jsonb_build_object('refunded', v_refunded));
  RETURN jsonb_build_object('success', true, 'refunded', v_refunded);
END; $function$
