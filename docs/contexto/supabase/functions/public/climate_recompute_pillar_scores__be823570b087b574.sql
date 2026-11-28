CREATE OR REPLACE FUNCTION public._climate_recompute_pillar_scores(p_survey_id uuid, p_min_responses integer)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_min        integer := GREATEST(COALESCE(p_min_responses, 5), 5);
  v_responders integer;
  v_written    integer := 0;
    v_marca      timestamptz := clock_timestamp();
BEGIN
    -- Sem a pesquisa, nada a agregar (evita linhas orfas de placar).
    IF NOT EXISTS (SELECT 1 FROM public.climate_surveys s WHERE s.id = p_survey_id) THEN
      RETURN 0;
    END IF;

    -- Serializa os recalculos da mesma pesquisa: dois envios simultaneos nao
    -- podem contar conjuntos diferentes de respostas nem gravar placar defasado.
    PERFORM pg_advisory_xact_lock(hashtextextended(p_survey_id::text, 0));

  SELECT count(*) INTO v_responders
  FROM public.climate_survey_responses
  WHERE survey_id = p_survey_id AND is_complete;

    IF COALESCE(v_responders, 0) >= v_min THEN
      INSERT INTO public.climate_pillar_scores
        (survey_id, department_id, pillar, score, response_count, calculated_at)
      SELECT p_survey_id, NULL, q.pillar,
           round(avg(CASE q.question_type
                       WHEN 'likert_10' THEN a.score * 10.0
                       WHEN 'nps'       THEN a.score * 10.0
                       WHEN 'likert_5'  THEN (a.score - 1) * 25.0
                       END), 2),
             count(DISTINCT resp.user_id),
             v_marca
    FROM public.climate_question_answers a
    JOIN public.climate_survey_responses resp ON resp.id = a.response_id
    JOIN public.climate_survey_questions q ON q.id = a.question_id
    WHERE resp.survey_id = p_survey_id
      AND resp.is_complete
      AND NOT a.skipped
      AND a.score IS NOT NULL
      AND q.question_type IN ('likert_5', 'likert_10', 'nps')
    GROUP BY q.pillar
    -- Pilar com menos respondentes que o minimo nao e' exposto: um pilar pode ter
    -- amostra propria menor que o total da pesquisa.
    HAVING count(DISTINCT resp.user_id) >= v_min
      ON CONFLICT (survey_id, pillar) WHERE department_id IS NULL
      DO UPDATE SET score          = EXCLUDED.score,
                    response_count = EXCLUDED.response_count,
                    calculated_at  = EXCLUDED.calculated_at;

      GET DIAGNOSTICS v_written = ROW_COUNT;
    END IF;

    -- Placar que nao foi reescrito agora nao pode continuar visivel: ou o pilar
    -- deixou de existir na pesquisa, ou a amostra caiu abaixo do minimo.
    UPDATE public.climate_pillar_scores
       SET score = 0, response_count = 0, calculated_at = v_marca
     WHERE survey_id = p_survey_id
       AND department_id IS NULL
       AND calculated_at < v_marca;

  RETURN v_written;
END;
$function$
