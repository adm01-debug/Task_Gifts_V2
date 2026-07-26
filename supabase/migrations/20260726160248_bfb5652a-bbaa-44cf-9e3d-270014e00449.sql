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

  SELECT tm.department_id INTO v_dept
  FROM public.team_members tm
  WHERE tm.user_id = v_user
  ORDER BY tm.joined_at DESC
  LIMIT 1;

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

-- Índice para acelerar os cortes por periodo nos calculos de clima
CREATE INDEX IF NOT EXISTS idx_eanswers_answered_at ON public.engagement_answers(answered_at DESC);
CREATE INDEX IF NOT EXISTS idx_eanswers_user_question ON public.engagement_answers(user_id, question_id);