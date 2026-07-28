CREATE OR REPLACE FUNCTION public.get_quiz_lifeline(p_question_id uuid, p_kind text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_correct uuid;
  v_ids uuid[];
  v_result jsonb := '[]'::jsonb;
  v_correct_pct integer;
  v_rest integer;
  v_n integer;
  v_id uuid;
  v_share integer;
  v_used integer := 0;
  v_others uuid[];
  v_i integer := 0;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  IF p_kind NOT IN ('audience', 'phone') THEN
    RAISE EXCEPTION 'Ajuda inválida';
  END IF;

  SELECT array_agg(o.id ORDER BY o.order_index) INTO v_ids
  FROM public.quiz_options o
  JOIN public.quiz_questions qq ON qq.id = o.question_id AND qq.is_active
  WHERE o.question_id = p_question_id;

  IF v_ids IS NULL OR array_length(v_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'Pergunta inválida';
  END IF;

  SELECT o.id INTO v_correct
  FROM public.quiz_options o
  WHERE o.question_id = p_question_id AND o.is_correct
  LIMIT 1;

  -- 20% de chance de a ajuda errar (mantém o risco do jogo)
  IF random() < 0.2 THEN
    SELECT o.id INTO v_correct
    FROM public.quiz_options o
    WHERE o.question_id = p_question_id AND o.id <> v_correct
    ORDER BY random()
    LIMIT 1;
  END IF;

  IF p_kind = 'phone' THEN
    RETURN jsonb_build_object(
      'suggested_option_id', v_correct,
      'confidence', (60 + floor(random() * 35))::int
    );
  END IF;

  v_n := array_length(v_ids, 1);
  v_correct_pct := 45 + floor(random() * 35)::int; -- 45..79
  v_rest := 100 - v_correct_pct;

  SELECT array_agg(x) INTO v_others FROM unnest(v_ids) x WHERE x <> v_correct;

  FOREACH v_id IN ARRAY COALESCE(v_others, ARRAY[]::uuid[]) LOOP
    v_i := v_i + 1;
    IF v_i = array_length(v_others, 1) THEN
      v_share := v_rest - v_used;
    ELSE
      v_share := GREATEST(0, floor(random() * (v_rest - v_used))::int);
    END IF;
    v_used := v_used + v_share;
    v_result := v_result || jsonb_build_array(jsonb_build_object('option_id', v_id, 'percent', v_share));
  END LOOP;

  v_result := v_result || jsonb_build_array(jsonb_build_object('option_id', v_correct, 'percent', v_correct_pct));

  RETURN jsonb_build_object('distribution', v_result);
END;
$$;

REVOKE ALL ON FUNCTION public.get_quiz_lifeline(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_quiz_lifeline(uuid, text) TO authenticated, service_role;