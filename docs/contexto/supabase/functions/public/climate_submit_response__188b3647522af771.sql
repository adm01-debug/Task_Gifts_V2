CREATE OR REPLACE FUNCTION public.climate_submit_response(p_survey_id uuid, p_answers jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id     uuid := auth.uid();
  v_status      text;
  v_starts_at   timestamptz;
  v_ends_at     timestamptz;
  v_response_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  IF p_answers IS NULL OR jsonb_typeof(p_answers) <> 'array' OR jsonb_array_length(p_answers) = 0 THEN
    RAISE EXCEPTION 'answers required';
  END IF;

  SELECT status, starts_at, ends_at
    INTO v_status, v_starts_at, v_ends_at
    FROM public.climate_surveys WHERE id = p_survey_id;
  IF v_status IS NULL THEN
    RAISE EXCEPTION 'survey not found';
  END IF;
  IF v_status <> 'active' THEN
    RAISE EXCEPTION 'survey is not active';
  END IF;
  -- O periodo e' regra do servidor: a tela nao pode ser o unico limite.
  IF v_starts_at IS NOT NULL AND now() < v_starts_at THEN
    RAISE EXCEPTION 'survey is not open yet';
  END IF;
  IF v_ends_at IS NOT NULL AND now() > v_ends_at THEN
    RAISE EXCEPTION 'survey period is over';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.climate_survey_responses
    WHERE survey_id = p_survey_id AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'survey already answered' USING ERRCODE = '23505';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_to_recordset(p_answers) AS a(question_id uuid, score integer, text_answer text)
    LEFT JOIN public.climate_survey_questions q ON q.id = a.question_id
    WHERE q.id IS NULL
       OR q.survey_id <> p_survey_id
       OR (
         a.score IS NOT NULL
         AND (
           (q.question_type IN ('likert_10', 'nps') AND (a.score < 0 OR a.score > 10))
           OR (q.question_type = 'likert_5' AND (a.score < 1 OR a.score > 5))
           OR q.question_type NOT IN ('likert_5', 'likert_10', 'nps')
         )
       )
  ) THEN
    RAISE EXCEPTION 'invalid answers';
  END IF;

  IF NOT (SELECT allow_skip FROM public.climate_surveys WHERE id = p_survey_id)
     AND EXISTS (
       SELECT 1
       FROM public.climate_survey_questions q
       WHERE q.survey_id = p_survey_id
         AND q.is_required
         AND q.question_type IN ('likert_5', 'likert_10', 'nps')
         AND NOT EXISTS (
           SELECT 1
           FROM jsonb_to_recordset(p_answers) AS a(question_id uuid, score integer)
           WHERE a.question_id = q.id AND a.score IS NOT NULL
         )
     ) THEN
    RAISE EXCEPTION 'required question missing';
  END IF;

  INSERT INTO public.climate_survey_responses (survey_id, user_id, is_complete, completed_at)
  VALUES (p_survey_id, v_user_id, true, now())
  RETURNING id INTO v_response_id;

  INSERT INTO public.climate_question_answers (response_id, question_id, score, text_answer, skipped)
  SELECT v_response_id, a.question_id, a.score, a.text_answer,
         (a.score IS NULL AND a.text_answer IS NULL)
  FROM jsonb_to_recordset(p_answers) AS a(question_id uuid, score integer, text_answer text);

  PERFORM public._climate_recompute_pillar_scores(p_survey_id, 5);

  RETURN v_response_id;
END;
$function$
