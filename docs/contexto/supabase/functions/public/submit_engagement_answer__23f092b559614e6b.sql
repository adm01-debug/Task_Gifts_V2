CREATE OR REPLACE FUNCTION public.submit_engagement_answer(p_cycle_id uuid, p_question_id uuid, p_raw_value jsonb, p_normalized_score numeric DEFAULT NULL::numeric, p_text_answer text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_user UUID := auth.uid(); v_dept UUID; v_id UUID;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.engagement_question_assignments a WHERE a.cycle_id = p_cycle_id AND a.question_id = p_question_id AND a.user_id = v_user) THEN
    RAISE EXCEPTION 'pergunta nao atribuida ao usuario neste ciclo' USING ERRCODE = '42501';
  END IF;
  SELECT tm.department_id INTO v_dept FROM public.team_members tm WHERE tm.user_id = v_user ORDER BY tm.joined_at DESC LIMIT 1;
  INSERT INTO public.engagement_answers (cycle_id, question_id, user_id, department_id, raw_value, normalized_score, text_answer) VALUES (p_cycle_id, p_question_id, v_user, v_dept, p_raw_value, LEAST(GREATEST(p_normalized_score, 0), 10), p_text_answer) ON CONFLICT (cycle_id, question_id, user_id) DO UPDATE SET raw_value = EXCLUDED.raw_value, normalized_score = EXCLUDED.normalized_score, text_answer = EXCLUDED.text_answer, answered_at = now() RETURNING id INTO v_id;
  UPDATE public.engagement_question_assignments SET answered_at = now() WHERE cycle_id = p_cycle_id AND question_id = p_question_id AND user_id = v_user;
  RETURN v_id;
END; $function$
