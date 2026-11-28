CREATE OR REPLACE FUNCTION public.grade_quiz_answer(p_question_id uuid, p_option_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_correct_id uuid; v_explanation text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  SELECT qq.explanation INTO v_explanation FROM public.quiz_questions qq WHERE qq.id = p_question_id AND qq.is_active = true;
  IF NOT FOUND THEN RAISE EXCEPTION 'Pergunta inválida'; END IF;
  SELECT o.id INTO v_correct_id FROM public.quiz_options o WHERE o.question_id = p_question_id AND o.is_correct LIMIT 1;
  RETURN jsonb_build_object('is_correct', (p_option_id IS NOT NULL AND p_option_id = v_correct_id), 'correct_option_id', v_correct_id, 'explanation', v_explanation);
END; $function$
