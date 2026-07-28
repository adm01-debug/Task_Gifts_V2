CREATE OR REPLACE FUNCTION public.transition_prediction_market(
  p_market_id uuid,
  p_action text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_market public.prediction_markets%ROWTYPE;
  v_options integer;
  v_settle jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF p_action NOT IN ('publish','lock','void') THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'unknown_action');
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(p_market_id::text, 1));

  SELECT * INTO v_market FROM public.prediction_markets WHERE id = p_market_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'market_not_found');
  END IF;
  IF v_market.status IN ('settled','voided') THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'market_terminal');
  END IF;

  IF p_action = 'publish' THEN
    IF v_market.status <> 'draft' THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'not_draft');
    END IF;
    SELECT count(*) INTO v_options FROM public.prediction_options WHERE market_id = p_market_id;
    IF v_options < 2 THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'need_two_options');
    END IF;
    IF v_market.locks_at <= now() THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'window_expired');
    END IF;
    UPDATE public.prediction_markets SET status = 'open' WHERE id = p_market_id;

  ELSIF p_action = 'lock' THEN
    IF v_market.status <> 'open' THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'not_open');
    END IF;
    UPDATE public.prediction_markets SET status = 'locked' WHERE id = p_market_id;

  ELSE
    -- Anular reaproveita a apuração sem vencedor (reembolso integral).
    -- O gatilho trg_log_prediction_settlement já registra o evento 'voided',
    -- por isso nada é inserido manualmente aqui.
    v_settle := public.settle_prediction_market(p_market_id, NULL);
    RETURN jsonb_build_object('ok', true, 'action', 'void', 'settlement', v_settle);
  END IF;

  INSERT INTO public.prediction_admin_events (market_id, action, actor_id, payload)
  VALUES (p_market_id, CASE WHEN p_action = 'publish' THEN 'published' ELSE 'locked' END,
          auth.uid(), jsonb_build_object('from', v_market.status));

  RETURN jsonb_build_object('ok', true, 'action', p_action);
END;
$$;

REVOKE ALL ON FUNCTION public.transition_prediction_market(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.transition_prediction_market(uuid, text) TO authenticated;