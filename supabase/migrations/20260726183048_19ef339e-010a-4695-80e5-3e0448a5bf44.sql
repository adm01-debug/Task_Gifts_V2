ALTER TABLE public.action_plans
  ADD COLUMN IF NOT EXISTS opinion_id UUID REFERENCES public.opinions(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_action_plans_opinion_unique
  ON public.action_plans(opinion_id)
  WHERE opinion_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.generate_action_plan_from_opinion(p_opinion_id UUID)
RETURNS UUID
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_plan_id UUID;
  v_opinion RECORD;
  v_topic TEXT;
  v_days INT;
  v_target DATE;
BEGIN
  IF v_uid IS NULL OR NOT public.can_handle_opinion(p_opinion_id, v_uid) THEN
    RAISE EXCEPTION 'Sem permissao para tratar esta manifestacao';
  END IF;

  SELECT o.id, o.subject, o.content, o.category, o.urgency
    INTO v_opinion
  FROM public.opinions o
  WHERE o.id = p_opinion_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Manifestacao inexistente';
  END IF;

  SELECT ap.id INTO v_plan_id FROM public.action_plans ap WHERE ap.opinion_id = p_opinion_id;
  IF v_plan_id IS NOT NULL THEN
    RETURN v_plan_id;
  END IF;

  v_topic := COALESCE(NULLIF(btrim(v_opinion.subject), ''), left(btrim(v_opinion.content), 80));

  v_days := CASE v_opinion.urgency::TEXT
    WHEN 'critical' THEN 15
    WHEN 'high' THEN 30
    WHEN 'low' THEN 90
    ELSE 60
  END;
  v_target := (now() + make_interval(days => v_days))::date;

  INSERT INTO public.action_plans (title, description, root_cause_summary, target_date, owner_id, status, source, opinion_id)
  VALUES (
    left('Tratativa: ' || v_topic, 180),
    'Plano derivado de manifestacao registrada no Canal de Opinioes.',
    left(btrim(v_opinion.content), 1000),
    v_target,
    v_uid,
    'planning',
    'opinion_channel',
    p_opinion_id
  )
  RETURNING id INTO v_plan_id;

  INSERT INTO public.action_plan_items
    (plan_id, what_title, what_description, why_reason, when_start, when_end, who_responsible_id, how_method, priority, order_index)
  VALUES
    (v_plan_id, 'Apurar o contexto da manifestacao',
     'Levantar dados e ouvir o time envolvido, preservando o anonimato de quem registrou.',
     'Entender a causa raiz antes de agir.',
     now()::date, (now() + make_interval(days => GREATEST(v_days / 4, 3)))::date, v_uid,
     'Escuta ativa e analise de indicadores do periodo.', 'high', 0),
    (v_plan_id, 'Definir contramedida',
     'Escolher a acao corretiva com dono, prazo e custo estimado.',
     'Transformar a escuta em mudanca concreta.',
     (now() + make_interval(days => GREATEST(v_days / 4, 3)))::date,
     (now() + make_interval(days => GREATEST(v_days / 2, 7)))::date, v_uid,
     'Workshop 5W2H com lideranca responsavel.', 'high', 1),
    (v_plan_id, 'Comunicar o retorno ao canal',
     'Publicar a resposta oficial na manifestacao e fechar o ciclo.',
     'Fechar o loop de escuta aumenta a confianca no canal.',
     (now() + make_interval(days => GREATEST(v_days / 2, 7)))::date, v_target, v_uid,
     'Resposta oficial no Canal de Opinioes e comunicado ao time.', 'medium', 2);

  UPDATE public.opinions
  SET status = 'in_progress'::opinion_status,
      read_at = COALESCE(read_at, now()),
      read_by = COALESCE(read_by, v_uid)
  WHERE id = p_opinion_id;

  RETURN v_plan_id;
END;
$$;

REVOKE ALL ON FUNCTION public.generate_action_plan_from_opinion(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.generate_action_plan_from_opinion(UUID) TO authenticated;