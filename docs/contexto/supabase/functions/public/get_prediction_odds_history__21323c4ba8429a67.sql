CREATE OR REPLACE FUNCTION public.get_prediction_odds_history(p_market_id uuid, p_buckets integer DEFAULT 40)
 RETURNS TABLE(bucket_end timestamp with time zone, option_id uuid, amount bigint)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_status text; v_first timestamptz; v_last timestamptz; v_buckets integer; v_width interval;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  SELECT status INTO v_status FROM public.prediction_markets WHERE id = p_market_id;
  IF v_status IS NULL OR v_status = 'draft' THEN RETURN; END IF;
  SELECT min(s.created_at), max(s.created_at) INTO v_first, v_last FROM public.prediction_stakes s WHERE s.market_id = p_market_id;
  IF v_first IS NULL THEN RETURN; END IF;
  v_buckets := greatest(1, least(coalesce(p_buckets, 40), 60));
  IF v_last <= v_first THEN RETURN QUERY SELECT v_last, s.option_id, sum(s.amount)::bigint FROM public.prediction_stakes s WHERE s.market_id = p_market_id GROUP BY s.option_id ORDER BY 1, 2; RETURN; END IF;
  v_width := (v_last - v_first) / v_buckets;
  RETURN QUERY SELECT least(v_first + v_width * (floor(extract(epoch FROM (s.created_at - v_first)) / nullif(extract(epoch FROM v_width), 0))::int + 1), v_last) AS bucket_end, s.option_id, sum(s.amount)::bigint AS amount FROM public.prediction_stakes s WHERE s.market_id = p_market_id GROUP BY 1, 2 ORDER BY 1, 2;
END; $function$
