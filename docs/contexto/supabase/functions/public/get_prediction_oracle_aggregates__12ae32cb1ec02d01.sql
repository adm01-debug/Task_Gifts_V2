CREATE OR REPLACE FUNCTION public.get_prediction_oracle_aggregates()
 RETURNS TABLE(user_id uuid, markets integer, stakes integer, total_staked bigint, total_payout bigint, hits integer, weighted_edge numeric, weighted_brier numeric)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH settled AS (SELECT m.id, m.winning_option_id FROM public.prediction_markets m WHERE m.status = 'settled' AND m.winning_option_id IS NOT NULL),
  option_counts AS (SELECT o.market_id, COUNT(*)::numeric AS n FROM public.prediction_options o JOIN settled s ON s.id = o.market_id GROUP BY o.market_id),
  priced AS (SELECT st.user_id, st.market_id, st.amount, COALESCE(st.payout, 0) AS payout, (st.option_id = s.winning_option_id) AS won, COALESCE(SUM(st.amount) OVER (PARTITION BY st.market_id, st.option_id ORDER BY st.created_at, st.id ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING), 0)::numeric AS prior_option_pool, COALESCE(SUM(st.amount) OVER (PARTITION BY st.market_id ORDER BY st.created_at, st.id ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING), 0)::numeric AS prior_total_pool, oc.n AS option_count FROM public.prediction_stakes st JOIN settled s ON s.id = st.market_id JOIN option_counts oc ON oc.market_id = st.market_id WHERE st.amount > 0),
  scored AS (SELECT p.user_id, p.market_id, p.amount, p.payout, p.won, CASE WHEN p.prior_total_pool > 0 THEN p.prior_option_pool / p.prior_total_pool ELSE 1.0 / GREATEST(p.option_count, 1) END AS implied_p FROM priced p)
  SELECT sc.user_id, COUNT(DISTINCT sc.market_id)::integer AS markets, COUNT(*)::integer AS stakes, SUM(sc.amount)::bigint AS total_staked, SUM(sc.payout)::bigint AS total_payout, COUNT(*) FILTER (WHERE sc.won)::integer AS hits, SUM(((CASE WHEN sc.won THEN 1 ELSE 0 END) - sc.implied_p) * sc.amount) AS weighted_edge, SUM(POWER((CASE WHEN sc.won THEN 1 ELSE 0 END) - sc.implied_p, 2) * sc.amount) AS weighted_brier FROM scored sc GROUP BY sc.user_id HAVING SUM(sc.amount) > 0;
$function$
