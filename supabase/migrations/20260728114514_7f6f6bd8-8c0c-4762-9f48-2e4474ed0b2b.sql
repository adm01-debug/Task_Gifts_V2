-- 1. Trilha auditável append-only
CREATE TABLE IF NOT EXISTS public.prediction_admin_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id uuid NOT NULL REFERENCES public.prediction_markets(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('created','published','locked','voided','settled','auto_locked')),
  actor_id uuid,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.prediction_admin_events TO authenticated;
GRANT ALL ON public.prediction_admin_events TO service_role;

ALTER TABLE public.prediction_admin_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins leem trilha de previsões"
  ON public.prediction_admin_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_prediction_admin_events_market
  ON public.prediction_admin_events(market_id, created_at DESC);

-- 2. Criar mercado com opções (valida tudo no servidor)
CREATE OR REPLACE FUNCTION public.create_prediction_market(
  p_title text,
  p_description text,
  p_options text[],
  p_min_stake integer,
  p_max_stake_per_user integer,
  p_rake_bps integer,
  p_locks_at timestamptz,
  p_resolves_at timestamptz DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_market_id uuid;
  v_clean text[];
  v_label text;
  v_idx integer := 0;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT array_agg(DISTINCT btrim(o)) INTO v_clean
  FROM unnest(COALESCE(p_options, ARRAY[]::text[])) AS o
  WHERE btrim(o) <> '';

  IF v_clean IS NULL OR array_length(v_clean, 1) < 2 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'need_two_options');
  END IF;
  IF array_length(v_clean, 1) > 6 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'too_many_options');
  END IF;
  IF length(btrim(COALESCE(p_title, ''))) < 5 OR length(btrim(p_title)) > 140 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_title');
  END IF;
  IF COALESCE(p_min_stake, 0) < 1 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_min_stake');
  END IF;
  IF COALESCE(p_max_stake_per_user, 0) < 0
     OR (p_max_stake_per_user > 0 AND p_max_stake_per_user < p_min_stake) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_user_cap');
  END IF;
  IF COALESCE(p_rake_bps, 0) < 0 OR p_rake_bps > 2000 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_rake');
  END IF;
  IF p_locks_at IS NULL OR p_locks_at <= now() + interval '15 minutes' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_window');
  END IF;
  IF p_resolves_at IS NOT NULL AND p_resolves_at < p_locks_at THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_resolves_at');
  END IF;

  INSERT INTO public.prediction_markets (
    title, description, status, min_stake, max_stake_per_user,
    rake_bps, locks_at, resolves_at, created_by
  ) VALUES (
    btrim(p_title), NULLIF(btrim(COALESCE(p_description, '')), ''), 'draft',
    p_min_stake, p_max_stake_per_user, p_rake_bps, p_locks_at, p_resolves_at, auth.uid()
  ) RETURNING id INTO v_market_id;

  FOREACH v_label IN ARRAY v_clean LOOP
    INSERT INTO public.prediction_options (market_id, label, sort_order)
    VALUES (v_market_id, left(v_label, 60), v_idx);
    v_idx := v_idx + 1;
  END LOOP;

  INSERT INTO public.prediction_admin_events (market_id, action, actor_id, payload)
  VALUES (v_market_id, 'created', auth.uid(),
          jsonb_build_object('options', v_clean, 'rake_bps', p_rake_bps, 'locks_at', p_locks_at));

  RETURN jsonb_build_object('ok', true, 'market_id', v_market_id);
END;
$$;

-- 3. Transições de estado (publicar / travar / anular)
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
    -- Anular = apurar sem vencedor: a RPC de apuração já devolve tudo.
    v_settle := public.settle_prediction_market(p_market_id, NULL);
    INSERT INTO public.prediction_admin_events (market_id, action, actor_id, payload)
    VALUES (p_market_id, 'voided', auth.uid(), v_settle);
    RETURN jsonb_build_object('ok', true, 'action', 'void', 'settlement', v_settle);
  END IF;

  INSERT INTO public.prediction_admin_events (market_id, action, actor_id, payload)
  VALUES (p_market_id, CASE WHEN p_action = 'publish' THEN 'published' ELSE 'locked' END,
          auth.uid(), jsonb_build_object('from', v_market.status));

  RETURN jsonb_build_object('ok', true, 'action', p_action);
END;
$$;

-- 4. Travamento automático dos mercados vencidos
CREATE OR REPLACE FUNCTION public.auto_lock_prediction_markets()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_row record;
  v_count integer := 0;
BEGIN
  FOR v_row IN
    SELECT id FROM public.prediction_markets
    WHERE status = 'open' AND locks_at <= now()
    ORDER BY locks_at
    FOR UPDATE SKIP LOCKED
  LOOP
    UPDATE public.prediction_markets SET status = 'locked' WHERE id = v_row.id;
    INSERT INTO public.prediction_admin_events (market_id, action, payload)
    VALUES (v_row.id, 'auto_locked', jsonb_build_object('locked_at', now()));
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.create_prediction_market(text, text, text[], integer, integer, integer, timestamptz, timestamptz) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.transition_prediction_market(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.auto_lock_prediction_markets() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_prediction_market(text, text, text[], integer, integer, integer, timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.transition_prediction_market(uuid, text) TO authenticated;

-- 5. Agendamento a cada 5 minutos
SELECT cron.schedule(
  'auto-lock-prediction-markets',
  '*/5 * * * *',
  $$SELECT public.auto_lock_prediction_markets();$$
);