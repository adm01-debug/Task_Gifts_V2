CREATE OR REPLACE FUNCTION public.settle_prediction_market(p_market_id uuid, p_winning_option_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_market public.prediction_markets%ROWTYPE;
  v_total integer;
  v_winner_pool integer := 0;
  v_rake integer := 0;
  v_distributable integer := 0;
  v_refund boolean := false;
  v_assigned integer := 0;
  v_remainder integer := 0;
  v_row record;
  v_rank integer := 0;
  v_paid integer := 0;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(p_market_id::text, 1));

  SELECT * INTO v_market FROM public.prediction_markets WHERE id = p_market_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'market_not_found');
  END IF;
  IF v_market.status IN ('settled','voided') THEN
    RETURN jsonb_build_object('ok', true, 'already_settled', true);
  END IF;

  SELECT COALESCE(SUM(amount), 0) INTO v_total
    FROM public.prediction_stakes WHERE market_id = p_market_id;

  IF p_winning_option_id IS NOT NULL THEN
    SELECT COALESCE(SUM(amount), 0) INTO v_winner_pool
      FROM public.prediction_stakes
      WHERE market_id = p_market_id AND option_id = p_winning_option_id;
  END IF;

  -- Reembolso: anulado, opção inválida, sem vencedores ou pool 100% vencedor.
  v_refund := p_winning_option_id IS NULL
    OR NOT EXISTS (SELECT 1 FROM public.prediction_options
                   WHERE id = p_winning_option_id AND market_id = p_market_id)
    OR v_winner_pool = 0
    OR v_winner_pool >= v_total;

  IF v_refund THEN
    FOR v_row IN
      SELECT user_id, SUM(amount)::integer AS amount
        FROM public.prediction_stakes WHERE market_id = p_market_id
        GROUP BY user_id
    LOOP
      UPDATE public.profiles SET coins = coins + v_row.amount WHERE id = v_row.user_id;
      v_paid := v_paid + v_row.amount;
      PERFORM public.enqueue_push(
        v_row.user_id,
        'Mercado de previsões anulado',
        'Seu aporte de ' || v_row.amount || ' moedas foi devolvido integralmente.',
        '/previsoes',
        'prediction_refund:' || p_market_id::text || ':' || v_row.user_id::text
      );
    END LOOP;

    UPDATE public.prediction_stakes s
      SET payout = agg.amount
      FROM (SELECT user_id, SUM(amount)::integer AS amount
              FROM public.prediction_stakes WHERE market_id = p_market_id
              GROUP BY user_id) agg
      WHERE s.market_id = p_market_id AND s.user_id = agg.user_id
        AND s.id = (SELECT id FROM public.prediction_stakes x
                     WHERE x.market_id = p_market_id AND x.user_id = agg.user_id
                     ORDER BY x.created_at LIMIT 1);
    UPDATE public.prediction_stakes SET payout = COALESCE(payout, 0)
      WHERE market_id = p_market_id AND payout IS NULL;

    UPDATE public.prediction_markets
      SET status = CASE WHEN p_winning_option_id IS NULL THEN 'voided' ELSE 'settled' END,
          winning_option_id = p_winning_option_id,
          rake_collected = 0,
          settled_at = now(),
          settled_by = auth.uid()
      WHERE id = p_market_id;

    RETURN jsonb_build_object('ok', true, 'refunded', true, 'total', v_total, 'paid', v_paid, 'rake', 0);
  END IF;

  v_rake := floor(v_total * v_market.rake_bps / 10000.0)::integer;
  v_distributable := v_total - v_rake;

  CREATE TEMP TABLE tmp_prediction_payout ON COMMIT DROP AS
    SELECT user_id,
           SUM(amount)::integer AS stake,
           floor(v_distributable::numeric * SUM(amount) / v_winner_pool)::integer AS amount
      FROM public.prediction_stakes
      WHERE market_id = p_market_id AND option_id = p_winning_option_id
      GROUP BY user_id;

  SELECT COALESCE(SUM(amount), 0) INTO v_assigned FROM tmp_prediction_payout;
  v_remainder := v_distributable - v_assigned;

  -- Resto determinístico: maiores aportes primeiro, desempate por user_id.
  FOR v_row IN
    SELECT user_id FROM tmp_prediction_payout ORDER BY stake DESC, user_id ASC
  LOOP
    EXIT WHEN v_rank >= v_remainder;
    UPDATE tmp_prediction_payout SET amount = amount + 1 WHERE user_id = v_row.user_id;
    v_rank := v_rank + 1;
  END LOOP;

  FOR v_row IN SELECT user_id, stake, amount FROM tmp_prediction_payout LOOP
    UPDATE public.profiles SET coins = coins + v_row.amount WHERE id = v_row.user_id;
    v_paid := v_paid + v_row.amount;
    UPDATE public.prediction_stakes
      SET payout = CASE WHEN id = (SELECT x.id FROM public.prediction_stakes x
                                    WHERE x.market_id = p_market_id AND x.user_id = v_row.user_id
                                    ORDER BY x.created_at LIMIT 1)
                        THEN v_row.amount ELSE 0 END
      WHERE market_id = p_market_id AND user_id = v_row.user_id;
    PERFORM public.enqueue_push(
      v_row.user_id,
      'Você acertou a previsão!',
      'Recebeu ' || v_row.amount || ' moedas (aporte de ' || v_row.stake || ').',
      '/previsoes',
      'prediction_win:' || p_market_id::text || ':' || v_row.user_id::text
    );
  END LOOP;

  UPDATE public.prediction_stakes SET payout = 0
    WHERE market_id = p_market_id AND payout IS NULL;

  UPDATE public.prediction_markets
    SET status = 'settled',
        winning_option_id = p_winning_option_id,
        rake_collected = v_rake,
        settled_at = now(),
        settled_by = auth.uid()
    WHERE id = p_market_id;

  RETURN jsonb_build_object(
    'ok', true, 'refunded', false, 'total', v_total,
    'paid', v_paid, 'rake', v_rake,
    'conserved', (v_paid + v_rake) = v_total
  );
END;
$function$
