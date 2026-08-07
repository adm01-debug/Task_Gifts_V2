-- Ciclo ativo atual
CREATE OR REPLACE FUNCTION public.get_active_engagement_cycle()
RETURNS public.engagement_cycles
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.engagement_cycles
  WHERE status = 'active' AND starts_at <= now() AND ends_at >= now()
  ORDER BY starts_at DESC
  LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.get_active_engagement_cycle() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_active_engagement_cycle() TO authenticated, service_role;

-- Distribuicao inteligente de perguntas
CREATE OR REPLACE FUNCTION public.assign_engagement_questions(p_cycle_id UUID DEFAULT NULL)
RETURNS TABLE (
  assignment_id UUID,
  question_id UUID,
  code TEXT,
  question_text TEXT,
  helper_text TEXT,
  pillar public.climate_pillar,
  factor_id UUID,
  answer_format public.engagement_answer_format,
  options JSONB,
  order_index INTEGER,
  answered_at TIMESTAMPTZ
)
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_cycle public.engagement_cycles;
  v_existing INTEGER;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  IF p_cycle_id IS NULL THEN
    SELECT * INTO v_cycle FROM public.get_active_engagement_cycle();
  ELSE
    SELECT * INTO v_cycle FROM public.engagement_cycles WHERE id = p_cycle_id;
  END IF;

  IF v_cycle.id IS NULL THEN
    RETURN;
  END IF;

  SELECT count(*) INTO v_existing
  FROM public.engagement_question_assignments a
  WHERE a.cycle_id = v_cycle.id AND a.user_id = v_user;

  IF v_existing = 0 THEN
    INSERT INTO public.engagement_question_assignments (cycle_id, user_id, question_id, order_index)
    SELECT v_cycle.id, v_user, q.id, row_number() OVER () - 1
    FROM (
      SELECT p.id
      FROM public.engagement_question_pool p
      LEFT JOIN LATERAL (
        SELECT max(a.answered_at) AS last_answered
        FROM public.engagement_answers a
        WHERE a.question_id = p.id AND a.user_id = v_user
      ) la ON true
      WHERE p.is_active
      ORDER BY
        COALESCE(la.last_answered, '-infinity'::timestamptz) ASC,
        random()
      LIMIT GREATEST(v_cycle.questions_per_user, 1)
    ) q
    ON CONFLICT (cycle_id, user_id, question_id) DO NOTHING;
  END IF;

  RETURN QUERY
  SELECT a.id, p.id, p.code, p.question_text, p.helper_text, p.pillar, p.factor_id,
         p.answer_format, p.options, a.order_index, a.answered_at
  FROM public.engagement_question_assignments a
  JOIN public.engagement_question_pool p ON p.id = a.question_id
  WHERE a.cycle_id = v_cycle.id AND a.user_id = v_user
  ORDER BY a.order_index;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.assign_engagement_questions(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.assign_engagement_questions(UUID) TO authenticated, service_role;

-- Registro de resposta
CREATE OR REPLACE FUNCTION public.submit_engagement_answer(
  p_cycle_id UUID,
  p_question_id UUID,
  p_raw_value JSONB,
  p_normalized_score NUMERIC DEFAULT NULL,
  p_text_answer TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_dept UUID;
  v_id UUID;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT department_id INTO v_dept FROM public.profiles WHERE id = v_user;

  INSERT INTO public.engagement_answers
    (cycle_id, question_id, user_id, department_id, raw_value, normalized_score, text_answer)
  VALUES
    (p_cycle_id, p_question_id, v_user, v_dept, p_raw_value,
     LEAST(GREATEST(p_normalized_score, 0), 10), p_text_answer)
  ON CONFLICT (cycle_id, question_id, user_id) DO UPDATE
    SET raw_value = EXCLUDED.raw_value,
        normalized_score = EXCLUDED.normalized_score,
        text_answer = EXCLUDED.text_answer,
        answered_at = now()
  RETURNING id INTO v_id;

  UPDATE public.engagement_question_assignments
  SET answered_at = now()
  WHERE cycle_id = p_cycle_id AND question_id = p_question_id AND user_id = v_user;

  RETURN v_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.submit_engagement_answer(UUID, UUID, JSONB, NUMERIC, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_engagement_answer(UUID, UUID, JSONB, NUMERIC, TEXT) TO authenticated, service_role;

-- Progresso do ciclo
CREATE OR REPLACE FUNCTION public.get_engagement_cycle_progress(p_cycle_id UUID)
RETURNS TABLE (total INTEGER, answered INTEGER, pending INTEGER)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    count(*)::int,
    count(*) FILTER (WHERE answered_at IS NOT NULL)::int,
    count(*) FILTER (WHERE answered_at IS NULL)::int
  FROM public.engagement_question_assignments
  WHERE cycle_id = p_cycle_id AND user_id = auth.uid();
$$;

REVOKE EXECUTE ON FUNCTION public.get_engagement_cycle_progress(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_engagement_cycle_progress(UUID) TO authenticated, service_role;