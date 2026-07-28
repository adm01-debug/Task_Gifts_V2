-- 1) Remove leitura do gabarito para jogadores
DROP POLICY IF EXISTS "Everyone can view options of active questions" ON public.quiz_options;

CREATE POLICY "Staff can view quiz options"
ON public.quiz_options
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'manager'::app_role)
);

-- 2) Conjunto de jogo sem gabarito
CREATE OR REPLACE FUNCTION public.get_quiz_play_set(p_quiz_type text, p_limit integer DEFAULT 10)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(jsonb_agg(q ORDER BY q->>'created_at' DESC), '[]'::jsonb)
  FROM (
    SELECT jsonb_build_object(
      'id', qq.id,
      'quiz_type', qq.quiz_type,
      'question', qq.question,
      'explanation', qq.explanation,
      'points', qq.points,
      'difficulty', qq.difficulty,
      'category', qq.category,
      'department_id', qq.department_id,
      'created_at', qq.created_at,
      'options', COALESCE((
        SELECT jsonb_agg(jsonb_build_object('id', o.id, 'text', o.text, 'order_index', o.order_index) ORDER BY o.order_index)
        FROM public.quiz_options o
        WHERE o.question_id = qq.id
      ), '[]'::jsonb)
    ) AS q
    FROM public.quiz_questions qq
    WHERE qq.is_active = true
      AND qq.quiz_type = p_quiz_type
      AND auth.uid() IS NOT NULL
    ORDER BY qq.created_at DESC
    LIMIT GREATEST(COALESCE(p_limit, 10), 1)
  ) s;
$$;

REVOKE ALL ON FUNCTION public.get_quiz_play_set(text, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_quiz_play_set(text, integer) TO authenticated, service_role;

-- 3) Correção server-side
CREATE OR REPLACE FUNCTION public.grade_quiz_answer(p_question_id uuid, p_option_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_correct_id uuid;
  v_explanation text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  SELECT qq.explanation INTO v_explanation
  FROM public.quiz_questions qq
  WHERE qq.id = p_question_id AND qq.is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pergunta inválida';
  END IF;

  SELECT o.id INTO v_correct_id
  FROM public.quiz_options o
  WHERE o.question_id = p_question_id AND o.is_correct
  LIMIT 1;

  RETURN jsonb_build_object(
    'is_correct', (p_option_id IS NOT NULL AND p_option_id = v_correct_id),
    'correct_option_id', v_correct_id,
    'explanation', v_explanation
  );
END;
$$;

REVOKE ALL ON FUNCTION public.grade_quiz_answer(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.grade_quiz_answer(uuid, uuid) TO authenticated, service_role;

-- 4) Ajuda 50/50 sem expor gabarito
CREATE OR REPLACE FUNCTION public.quiz_fifty_fifty(p_question_id uuid)
RETURNS uuid[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(array_agg(x.id), ARRAY[]::uuid[])
  FROM (
    SELECT o.id
    FROM public.quiz_options o
    JOIN public.quiz_questions qq ON qq.id = o.question_id AND qq.is_active
    WHERE o.question_id = p_question_id
      AND o.is_correct = false
      AND auth.uid() IS NOT NULL
    ORDER BY random()
    LIMIT 2
  ) x;
$$;

REVOKE ALL ON FUNCTION public.quiz_fifty_fifty(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.quiz_fifty_fifty(uuid) TO authenticated, service_role;