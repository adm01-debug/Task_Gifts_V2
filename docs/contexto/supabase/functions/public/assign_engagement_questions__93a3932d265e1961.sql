CREATE OR REPLACE FUNCTION public.assign_engagement_questions(p_cycle_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(assignment_id uuid, question_id uuid, code text, question_text text, helper_text text, pillar climate_pillar, factor_id uuid, answer_format engagement_answer_format, options jsonb, order_index integer, answered_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_user UUID := auth.uid(); v_cycle public.engagement_cycles; v_existing INTEGER;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF p_cycle_id IS NULL THEN SELECT * INTO v_cycle FROM public.get_active_engagement_cycle();
  ELSE SELECT * INTO v_cycle FROM public.engagement_cycles WHERE id = p_cycle_id; END IF;
  IF v_cycle.id IS NULL THEN RETURN; END IF;
  SELECT count(*) INTO v_existing FROM public.engagement_question_assignments a WHERE a.cycle_id = v_cycle.id AND a.user_id = v_user;
  IF v_existing = 0 THEN
    INSERT INTO public.engagement_question_assignments (cycle_id, user_id, question_id, order_index)
    SELECT v_cycle.id, v_user, q.id, row_number() OVER () - 1 FROM (SELECT p.id FROM public.engagement_question_pool p LEFT JOIN LATERAL (SELECT max(a.answered_at) AS last_answered FROM public.engagement_answers a WHERE a.question_id = p.id AND a.user_id = v_user) la ON true WHERE p.is_active ORDER BY COALESCE(la.last_answered, '-infinity'::timestamptz) ASC, random() LIMIT GREATEST(v_cycle.questions_per_user, 1)) q ON CONFLICT (cycle_id, user_id, question_id) DO NOTHING;
  END IF;
  RETURN QUERY SELECT a.id, p.id, p.code, p.question_text, p.helper_text, p.pillar, p.factor_id, p.answer_format, p.options, a.order_index, a.answered_at FROM public.engagement_question_assignments a JOIN public.engagement_question_pool p ON p.id = a.question_id WHERE a.cycle_id = v_cycle.id AND a.user_id = v_user ORDER BY a.order_index;
END; $function$
