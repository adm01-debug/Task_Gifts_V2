-- Série histórica anonimizada de um mercado de previsão.
-- Privacidade: a RLS de prediction_stakes só permite ao usuário ver os
-- próprios aportes. Esta função agrega no servidor (SECURITY DEFINER) e
-- devolve apenas somas por opção/faixa de tempo — nunca user_id nem valores
-- individuais, que poderiam desanonimizar apostadores em mercados pequenos.
CREATE OR REPLACE FUNCTION public.get_prediction_odds_history(
  p_market_id uuid,
  p_buckets integer DEFAULT 40
)
RETURNS TABLE (bucket_end timestamptz, option_id uuid, amount bigint)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_status text;
  v_first timestamptz;
  v_last timestamptz;
  v_buckets integer;
  v_width interval;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'unauthenticated';
  END IF;

  SELECT status INTO v_status FROM public.prediction_markets WHERE id = p_market_id;
  IF v_status IS NULL OR v_status = 'draft' THEN
    RETURN;
  END IF;

  SELECT min(s.created_at), max(s.created_at)
    INTO v_first, v_last
    FROM public.prediction_stakes s
   WHERE s.market_id = p_market_id;

  IF v_first IS NULL THEN
    RETURN;
  END IF;

  v_buckets := greatest(1, least(coalesce(p_buckets, 40), 60));

  IF v_last <= v_first THEN
    -- Todos os aportes no mesmo instante: uma única faixa.
    RETURN QUERY
      SELECT v_last, s.option_id, sum(s.amount)::bigint
        FROM public.prediction_stakes s
       WHERE s.market_id = p_market_id
       GROUP BY s.option_id
       ORDER BY 1, 2;
    RETURN;
  END IF;

  v_width := (v_last - v_first) / v_buckets;

  RETURN QUERY
    SELECT
      -- Faixa fechada à direita: o aporte final cai na última faixa.
      least(v_first + v_width * (floor(extract(epoch FROM (s.created_at - v_first))
              / nullif(extract(epoch FROM v_width), 0))::int + 1), v_last) AS bucket_end,
      s.option_id,
      sum(s.amount)::bigint AS amount
      FROM public.prediction_stakes s
     WHERE s.market_id = p_market_id
     GROUP BY 1, 2
     ORDER BY 1, 2;
END;
$$;

REVOKE ALL ON FUNCTION public.get_prediction_odds_history(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_prediction_odds_history(uuid, integer) TO authenticated;

CREATE INDEX IF NOT EXISTS idx_prediction_stakes_market_created
  ON public.prediction_stakes (market_id, created_at);