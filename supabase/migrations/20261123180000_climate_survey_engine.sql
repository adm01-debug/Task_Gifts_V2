-- =====================================================
-- Pesquisa de Clima: envio atomico, agregacao por pilar e eNPS
-- =====================================================
-- Contexto (verificado em producao): as tabelas climate_* existiam sem nenhum
-- caminho que escrevesse climate_pillar_scores, e a RLS de
-- climate_question_answers so permite leitura do proprio autor ou admin, de modo
-- que a agregacao para gestores nao era possivel pelo cliente.
-- Estas funcoes fazem a agregacao no servidor e preservam o anonimato
-- (minimo de respondentes antes de qualquer resultado ser exposto).

-- 1) Impede resposta duplicada do mesmo usuario na mesma pesquisa
CREATE UNIQUE INDEX IF NOT EXISTS climate_survey_responses_survey_user_key
  ON public.climate_survey_responses (survey_id, user_id);

-- 2) Recalculo interno (sem checagem de autorizacao; EXECUTE revogado do cliente)
CREATE OR REPLACE FUNCTION public._climate_recompute_pillar_scores(
  p_survey_id uuid,
  p_min_responses integer
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_responders integer;
  v_written    integer := 0;
  r            record;
BEGIN
  SELECT count(*) INTO v_responders
  FROM public.climate_survey_responses
  WHERE survey_id = p_survey_id AND is_complete;

  DELETE FROM public.climate_pillar_scores
  WHERE survey_id = p_survey_id AND department_id IS NULL;

  IF COALESCE(v_responders, 0) < GREATEST(COALESCE(p_min_responses, 5), 1) THEN
    RETURN 0;
  END IF;

  FOR r IN
    SELECT q.pillar AS pillar,
           round(avg(CASE q.question_type
                       WHEN 'likert_10' THEN a.score * 10.0
                       WHEN 'nps'       THEN a.score * 10.0
                       WHEN 'likert_5'  THEN (a.score - 1) * 25.0
                     END), 2) AS score,
           count(DISTINCT resp.user_id) AS response_count
    FROM public.climate_question_answers a
    JOIN public.climate_survey_responses resp ON resp.id = a.response_id
    JOIN public.climate_survey_questions q ON q.id = a.question_id
    WHERE resp.survey_id = p_survey_id
      AND resp.is_complete
      AND NOT a.skipped
      AND a.score IS NOT NULL
      AND q.question_type IN ('likert_5', 'likert_10', 'nps')
    GROUP BY q.pillar
  LOOP
    INSERT INTO public.climate_pillar_scores
      (survey_id, department_id, pillar, score, response_count)
    VALUES
      (p_survey_id, NULL, r.pillar, r.score, r.response_count);
    v_written := v_written + 1;
  END LOOP;

  RETURN v_written;
END;
$$;

REVOKE ALL ON FUNCTION public._climate_recompute_pillar_scores(uuid, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public._climate_recompute_pillar_scores(uuid, integer) FROM anon;
REVOKE ALL ON FUNCTION public._climate_recompute_pillar_scores(uuid, integer) FROM authenticated;

-- 3) Recalculo publico (admin, gestor ou criador da pesquisa)
CREATE OR REPLACE FUNCTION public.climate_recalculate_pillar_scores(
  p_survey_id uuid,
  p_min_responses integer DEFAULT 5
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  IF NOT (
    public.has_role(v_user_id, 'admin')
    OR public.has_role(v_user_id, 'manager')
    OR EXISTS (SELECT 1 FROM public.climate_surveys s WHERE s.id = p_survey_id AND s.created_by = v_user_id)
  ) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  RETURN public._climate_recompute_pillar_scores(p_survey_id, p_min_responses);
END;
$$;

GRANT EXECUTE ON FUNCTION public.climate_recalculate_pillar_scores(uuid, integer) TO authenticated;
REVOKE ALL ON FUNCTION public.climate_recalculate_pillar_scores(uuid, integer) FROM anon;

-- 4) eNPS agregado (usa a pergunta NPS da pesquisa; sem ela, as perguntas 0-10)
CREATE OR REPLACE FUNCTION public.climate_survey_enps(
  p_survey_id uuid,
  p_min_responses integer DEFAULT 5
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id    uuid := auth.uid();
  v_min        integer := GREATEST(COALESCE(p_min_responses, 5), 1);
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

  IF v_responders < v_min THEN
    RETURN jsonb_build_object(
      'enps', 0, 'promoters', 0, 'passives', 0, 'detractors', 0,
      'total', 0, 'response_count', v_responders,
      'suppressed', true, 'min_responses', v_min
    );
  END IF;

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
$$;

GRANT EXECUTE ON FUNCTION public.climate_survey_enps(uuid, integer) TO authenticated;
REVOKE ALL ON FUNCTION public.climate_survey_enps(uuid, integer) FROM anon;

-- 5) Envio atomico da resposta (pesquisa ativa, sem resposta duplicada)
CREATE OR REPLACE FUNCTION public.climate_submit_response(
  p_survey_id uuid,
  p_answers jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id     uuid := auth.uid();
  v_status      text;
  v_response_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  IF p_answers IS NULL OR jsonb_typeof(p_answers) <> 'array' OR jsonb_array_length(p_answers) = 0 THEN
    RAISE EXCEPTION 'answers required';
  END IF;

  SELECT status INTO v_status FROM public.climate_surveys WHERE id = p_survey_id;
  IF v_status IS NULL THEN
    RAISE EXCEPTION 'survey not found';
  END IF;
  IF v_status <> 'active' THEN
    RAISE EXCEPTION 'survey is not active';
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
$$;

GRANT EXECUTE ON FUNCTION public.climate_submit_response(uuid, jsonb) TO authenticated;
REVOKE ALL ON FUNCTION public.climate_submit_response(uuid, jsonb) FROM anon;