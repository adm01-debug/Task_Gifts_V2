-- 1) Esconde a ordem canônica dos jogadores
DROP POLICY IF EXISTS "sequence_steps_select" ON public.sequence_steps;
CREATE POLICY "sequence_steps_select_staff" ON public.sequence_steps
FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- 2) Conjunto jogável: etapas embaralhadas, sem "position"
CREATE OR REPLACE FUNCTION public.get_sequence_play_set(p_procedure_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_proc record;
  v_steps jsonb;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'unauthenticated');
  END IF;

  SELECT id, title, description, department_id, is_active
    INTO v_proc
  FROM public.sequence_procedures
  WHERE id = p_procedure_id AND is_active;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_found');
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object('id', s.id, 'label', s.label, 'hint', s.hint)
                            ORDER BY md5(s.id::text || v_user::text)), '[]'::jsonb)
    INTO v_steps
  FROM public.sequence_steps s
  WHERE s.procedure_id = p_procedure_id;

  RETURN jsonb_build_object(
    'success', true,
    'id', v_proc.id,
    'title', v_proc.title,
    'description', v_proc.description,
    'department_id', v_proc.department_id,
    'is_active', v_proc.is_active,
    'steps', v_steps
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_sequence_play_set(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_sequence_play_set(uuid) TO authenticated, service_role;

-- 3) Correção devolve o gabarito somente após o envio
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
  v_wrong integer[];
  v_correct_order uuid[];
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

  -- Índices (base 0) das posições incorretas, para destaque na interface
  SELECT COALESCE(array_agg((submitted.ord - 1)::integer ORDER BY submitted.ord), '{}')
    INTO v_wrong
  FROM unnest(p_order) WITH ORDINALITY AS submitted(step_id, ord)
  JOIN public.sequence_steps s ON s.id = submitted.step_id
  WHERE s.position <> submitted.ord;

  SELECT COALESCE(array_agg(s.id ORDER BY s.position), '{}')
    INTO v_correct_order
  FROM public.sequence_steps s
  WHERE s.procedure_id = p_procedure_id;

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
    'xp_awarded', v_xp,
    'wrong_indexes', to_jsonb(v_wrong),
    'correct_order', to_jsonb(v_correct_order)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.submit_sequence_attempt(uuid, uuid[], integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_sequence_attempt(uuid, uuid[], integer) TO authenticated, service_role;