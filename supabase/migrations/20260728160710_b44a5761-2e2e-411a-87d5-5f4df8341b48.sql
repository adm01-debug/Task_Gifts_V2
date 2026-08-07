-- 1. Procedimentos (SOPs)
CREATE TABLE public.sequence_procedures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sequence_procedures TO authenticated;
GRANT ALL ON public.sequence_procedures TO service_role;
ALTER TABLE public.sequence_procedures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sequence_procedures_select" ON public.sequence_procedures
  FOR SELECT TO authenticated
  USING (is_active OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "sequence_procedures_admin_write" ON public.sequence_procedures
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_sequence_procedures_updated_at
  BEFORE UPDATE ON public.sequence_procedures
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Etapas
CREATE TABLE public.sequence_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  procedure_id uuid NOT NULL REFERENCES public.sequence_procedures(id) ON DELETE CASCADE,
  label text NOT NULL,
  hint text,
  position integer NOT NULL CHECK (position >= 1 AND position <= 20),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (procedure_id, position) DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX idx_sequence_steps_procedure ON public.sequence_steps (procedure_id, position);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sequence_steps TO authenticated;
GRANT ALL ON public.sequence_steps TO service_role;
ALTER TABLE public.sequence_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sequence_steps_select" ON public.sequence_steps
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.sequence_procedures p
    WHERE p.id = sequence_steps.procedure_id
      AND (p.is_active OR has_role(auth.uid(), 'admin'::app_role))
  ));

CREATE POLICY "sequence_steps_admin_write" ON public.sequence_steps
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_sequence_steps_updated_at
  BEFORE UPDATE ON public.sequence_steps
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Tentativas
CREATE TABLE public.sequence_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  procedure_id uuid NOT NULL REFERENCES public.sequence_procedures(id) ON DELETE CASCADE,
  submitted_order uuid[] NOT NULL DEFAULT '{}',
  steps_total integer NOT NULL DEFAULT 0,
  correct_positions integer NOT NULL DEFAULT 0,
  is_perfect boolean NOT NULL DEFAULT false,
  duration_ms integer NOT NULL DEFAULT 0,
  coins_awarded integer NOT NULL DEFAULT 0,
  xp_awarded integer NOT NULL DEFAULT 0,
  attempt_date date NOT NULL DEFAULT ((now() AT TIME ZONE 'utc')::date),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_sequence_attempts_user_day
  ON public.sequence_attempts (user_id, procedure_id, attempt_date);
CREATE INDEX idx_sequence_attempts_leaderboard
  ON public.sequence_attempts (procedure_id, attempt_date);

GRANT SELECT ON public.sequence_attempts TO authenticated;
GRANT ALL ON public.sequence_attempts TO service_role;
ALTER TABLE public.sequence_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sequence_attempts_select_own" ON public.sequence_attempts
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- 4. Correção e crédito no servidor
CREATE OR REPLACE FUNCTION public.submit_sequence_attempt(
  p_procedure_id uuid,
  p_order uuid[],
  p_duration_ms integer DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_total integer;
  v_correct integer := 0;
  v_perfect boolean;
  v_rewarded_today integer;
  v_daily_limit constant integer := 3;
  v_coins integer := 0;
  v_xp integer := 0;
  v_duration integer := LEAST(GREATEST(COALESCE(p_duration_ms, 0), 0), 3600000);
  v_attempt_id uuid;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'unauthenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.sequence_procedures
    WHERE id = p_procedure_id AND is_active
  ) THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_found');
  END IF;

  SELECT count(*) INTO v_total
  FROM public.sequence_steps WHERE procedure_id = p_procedure_id;

  IF v_total = 0 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'empty');
  END IF;

  -- A ordem enviada precisa conter exatamente as etapas do procedimento, sem repetições.
  IF p_order IS NULL
     OR array_length(p_order, 1) IS DISTINCT FROM v_total
     OR (SELECT count(DISTINCT x) FROM unnest(p_order) x) <> v_total
     OR EXISTS (
       SELECT 1 FROM unnest(p_order) x
       WHERE NOT EXISTS (
         SELECT 1 FROM public.sequence_steps s
         WHERE s.id = x AND s.procedure_id = p_procedure_id
       )
     )
  THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_order');
  END IF;

  SELECT count(*) INTO v_correct
  FROM unnest(p_order) WITH ORDINALITY AS submitted(step_id, ord)
  JOIN public.sequence_steps s ON s.id = submitted.step_id
  WHERE s.position = submitted.ord;

  v_perfect := (v_correct = v_total);

  SELECT count(*) INTO v_rewarded_today
  FROM public.sequence_attempts
  WHERE user_id = v_user
    AND procedure_id = p_procedure_id
    AND attempt_date = (now() AT TIME ZONE 'utc')::date
    AND (coins_awarded > 0 OR xp_awarded > 0);

  IF v_rewarded_today < v_daily_limit THEN
    v_coins := LEAST(150, v_correct * 8 + CASE WHEN v_perfect THEN 40 ELSE 0 END);
    v_xp := LEAST(250, v_correct * 12 + CASE WHEN v_perfect THEN 60 ELSE 0 END);
  END IF;

  INSERT INTO public.sequence_attempts (
    user_id, procedure_id, submitted_order, steps_total,
    correct_positions, is_perfect, duration_ms, coins_awarded, xp_awarded
  ) VALUES (
    v_user, p_procedure_id, p_order, v_total,
    v_correct, v_perfect, v_duration, v_coins, v_xp
  ) RETURNING id INTO v_attempt_id;

  IF v_coins > 0 OR v_xp > 0 THEN
    UPDATE public.profiles
    SET coins = COALESCE(coins, 0) + v_coins,
        xp = COALESCE(xp, 0) + v_xp
    WHERE id = v_user;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'attempt_id', v_attempt_id,
    'steps_total', v_total,
    'correct_positions', v_correct,
    'is_perfect', v_perfect,
    'daily_limit_reached', v_rewarded_today >= v_daily_limit,
    'coins_awarded', v_coins,
    'xp_awarded', v_xp
  );
END;
$$;

REVOKE ALL ON FUNCTION public.submit_sequence_attempt(uuid, uuid[], integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_sequence_attempt(uuid, uuid[], integer) TO authenticated;