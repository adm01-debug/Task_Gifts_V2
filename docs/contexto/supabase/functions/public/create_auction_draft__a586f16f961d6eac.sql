CREATE OR REPLACE FUNCTION public.create_auction_draft(p_title text, p_description text, p_starting_bid integer, p_min_increment integer, p_starts_at timestamp with time zone, p_ends_at timestamp with time zone, p_reward_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_id UUID; v_title TEXT := btrim(COALESCE(p_title, ''));
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF length(v_title) < 3 THEN RETURN jsonb_build_object('success', false, 'reason', 'invalid_title'); END IF;
  IF COALESCE(p_starting_bid, 0) < 1 OR COALESCE(p_min_increment, 0) < 1 THEN RETURN jsonb_build_object('success', false, 'reason', 'invalid_economics'); END IF;
  IF p_ends_at IS NULL OR p_starts_at IS NULL OR p_ends_at <= p_starts_at THEN RETURN jsonb_build_object('success', false, 'reason', 'invalid_window'); END IF;
  IF p_reward_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.shop_rewards WHERE id = p_reward_id AND is_active = true) THEN RETURN jsonb_build_object('success', false, 'reason', 'reward_unavailable'); END IF;
  INSERT INTO public.auctions (title, description, starting_bid, min_increment, starts_at, ends_at, reward_id, status, created_by) VALUES (v_title, NULLIF(btrim(COALESCE(p_description, '')), ''), p_starting_bid, p_min_increment, p_starts_at, p_ends_at, p_reward_id, 'draft', auth.uid()) RETURNING id INTO v_id;
  PERFORM public.log_auction_admin_event(v_id, 'draft_created', jsonb_build_object('title', v_title, 'starting_bid', p_starting_bid, 'min_increment', p_min_increment, 'starts_at', p_starts_at, 'ends_at', p_ends_at, 'reward_id', p_reward_id));
  RETURN jsonb_build_object('success', true, 'id', v_id);
END; $function$
