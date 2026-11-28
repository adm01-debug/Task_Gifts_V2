CREATE OR REPLACE FUNCTION public.climate_survey_enps(p_survey_id uuid, p_min_responses integer DEFAULT 5)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id    uuid := auth.uid();
  v_min        integer := GREATEST(COALESCE(p_min_responses, 5), 5);
  v_responders integer := 0;
  v_total      integer := 0;
  v_promoters  integer := 0;
  v_passives   integer := 0;
  v_detractors integer := 0;
  v_enps       integer := 0;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.climate_surveys s WHERE s.id = p_survey_id) THEN
    RAISE EXCEPTION 'survey not found';
  END IF;

  IF NOT (
    public.has_role(v_user_id, 'admin')
    OR public.has_role(v_user_id, 'manager')
    OR EXISTS (SELECT 1 FROM public.climate_surveys s WHERE s.id = p_survey_id AND s.created_by = v_user_id)
  ) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  SELECT count(*) INTO v_responders
  FROM public.climate_survey_responses
  WHERE survey_id = p_survey_id AND is_complete;
  v_responders := COALESCE(v_responders, 0);

  SELECT count(*),
         count(*) FILTER (WHERE a.score >= 9),
         count(*) FILTER (WHERE a.score >= 7 AND a.score < 9),
         count(*) FILTER (WHERE a.score < 7)
    INTO v_total, v_promoters, v_passives, v_detractors
  FROM public.climate_question_answers a
  JOIN public.climate_survey_responses resp ON resp.id = a.response_id
  JOIN public.climate_survey_questions q ON q.id = a.question_id
  WHERE resp.survey_id = p_survey_id
    AND resp.is_complete
    AND NOT a.skipped
    AND a.score IS NOT NULL
    AND (
      q.question_type = 'nps'
      OR (
        q.question_type = 'likert_10'
        AND NOT EXISTS (
          SELECT 1 FROM public.climate_survey_questions q2
          WHERE q2.survey_id = p_survey_id AND q2.question_type = 'nps'
        )
      )
    );

  v_total := COALESCE(v_total, 0);

  -- Amostra insuficiente (de respondentes ou de notas elegiveis) suprime o eNPS:
  -- devolve `suppressed` em vez de zero, para a tela nao anunciar "0" sem base.
  IF v_responders < v_min OR v_total < v_min THEN
    RETURN jsonb_build_object(
      'enps', 0, 'promoters', 0, 'passives', 0, 'detractors', 0,
      'total', 0, 'response_count', v_responders,
      'suppressed', true, 'min_responses', v_min
    );
  END IF;

  IF v_total > 0 THEN
    v_enps := round(((v_promoters - v_detractors)::numeric / v_total) * 100);
  END IF;

  RETURN jsonb_build_object(
    'enps', v_enps,
    'promoters', v_promoters,
    'passives', v_passives,
    'detractors', v_detractors,
    'total', v_total,
    'response_count', v_responders,
    'suppressed', false,
    'min_responses', v_min
  );
END;
$function$
