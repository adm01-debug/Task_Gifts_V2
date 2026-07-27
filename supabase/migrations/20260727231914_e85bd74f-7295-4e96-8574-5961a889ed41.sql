-- =========================================================
-- GANCHOS AUTOMATICOS DA GUERRA DE DEPARTAMENTOS
-- Eventos reais do sistema viram contribuicoes idempotentes.
-- =========================================================

-- ---------------------------------------------------------
-- Nucleo de ingestao. NAO usa auth.uid(): o ator vem da linha
-- de origem, porque o trigger pode rodar em contexto de servico.
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION public.ingest_war_event(
  p_user_id uuid,
  p_metric_key text,
  p_amount numeric,
  p_dedupe_key text
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_dept uuid;
  v_amount numeric;
  v_key text;
  v_count integer := 0;
  v_war record;
BEGIN
  IF p_user_id IS NULL THEN RETURN 0; END IF;

  v_amount := floor(COALESCE(p_amount, 0));
  IF v_amount IS NULL OR v_amount <= 0 THEN RETURN 0; END IF;
  IF v_amount > 1000000 THEN v_amount := 1000000; END IF;

  IF p_metric_key IS NULL OR length(trim(p_metric_key)) = 0 THEN RETURN 0; END IF;
  IF p_dedupe_key IS NULL OR length(trim(p_dedupe_key)) = 0 THEN RETURN 0; END IF;

  v_key := p_user_id::text || ':' || left(trim(p_dedupe_key), 180);

  v_dept := public.get_user_department_id(p_user_id);
  IF v_dept IS NULL THEN RETURN 0; END IF;

  FOR v_war IN
    SELECT w.id
      FROM public.department_wars w
      JOIN public.department_war_departments d
        ON d.war_id = w.id AND d.department_id = v_dept
     WHERE w.status = 'running'
       AND now() >= w.starts_at
       AND now() <= w.ends_at
       AND EXISTS (
         SELECT 1 FROM public.department_war_metrics m
          WHERE m.war_id = w.id AND m.metric_key = trim(p_metric_key)
       )
  LOOP
    INSERT INTO public.department_war_contributions
      (war_id, department_id, user_id, metric_key, amount, dedupe_key)
    VALUES (v_war.id, v_dept, p_user_id, trim(p_metric_key), v_amount, v_key)
    ON CONFLICT (war_id, dedupe_key) DO NOTHING;

    IF FOUND THEN v_count := v_count + 1; END IF;
  END LOOP;

  RETURN v_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.ingest_war_event(uuid, text, numeric, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ingest_war_event(uuid, text, numeric, text) TO service_role;

-- ---------------------------------------------------------
-- Trigger: tarefas concluidas (task_scores)
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION public.war_hook_task_scores()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  BEGIN
    IF NEW.completed_at IS NOT NULL
       AND (TG_OP = 'INSERT' OR OLD.completed_at IS NULL)
       AND lower(NEW.status::text) = 'completed' THEN
      PERFORM public.ingest_war_event(
        NEW.user_id, 'tarefa_concluida', 1, 'task:' || NEW.id::text);
      IF NEW.is_late IS FALSE THEN
        PERFORM public.ingest_war_event(
          NEW.user_id, 'tarefa_no_prazo', 1, 'task_ontime:' || NEW.id::text);
      END IF;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL; -- gancho jamais derruba a transacao de origem
  END;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_war_hook_task_scores ON public.task_scores;
CREATE TRIGGER trg_war_hook_task_scores
AFTER INSERT OR UPDATE OF status, completed_at ON public.task_scores
FOR EACH ROW EXECUTE FUNCTION public.war_hook_task_scores();

-- ---------------------------------------------------------
-- Trigger: check-in pontual (attendance_records)
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION public.war_hook_attendance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  BEGIN
    IF NEW.is_punctual IS TRUE AND NEW.check_in IS NOT NULL THEN
      PERFORM public.ingest_war_event(
        NEW.user_id, 'checkin_pontual', 1, 'attendance:' || NEW.id::text);
    END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_war_hook_attendance ON public.attendance_records;
CREATE TRIGGER trg_war_hook_attendance
AFTER INSERT OR UPDATE OF is_punctual, check_in ON public.attendance_records
FOR EACH ROW EXECUTE FUNCTION public.war_hook_attendance();

-- ---------------------------------------------------------
-- Trigger: trilha concluida (trail_enrollments)
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION public.war_hook_trail_enrollments()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  BEGIN
    IF NEW.completed_at IS NOT NULL
       AND (TG_OP = 'INSERT' OR OLD.completed_at IS NULL) THEN
      PERFORM public.ingest_war_event(
        NEW.user_id, 'trilha_concluida', 1, 'trail:' || NEW.id::text);
    END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_war_hook_trail_enrollments ON public.trail_enrollments;
CREATE TRIGGER trg_war_hook_trail_enrollments
AFTER INSERT OR UPDATE OF completed_at ON public.trail_enrollments
FOR EACH ROW EXECUTE FUNCTION public.war_hook_trail_enrollments();

-- ---------------------------------------------------------
-- Trigger: modulo concluido (module_progress)
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION public.war_hook_module_progress()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  BEGIN
    IF NEW.completed_at IS NOT NULL
       AND (TG_OP = 'INSERT' OR OLD.completed_at IS NULL) THEN
      PERFORM public.ingest_war_event(
        NEW.user_id, 'modulo_concluido', 1, 'module:' || NEW.id::text);
    END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_war_hook_module_progress ON public.module_progress;
CREATE TRIGGER trg_war_hook_module_progress
AFTER INSERT OR UPDATE OF completed_at ON public.module_progress
FOR EACH ROW EXECUTE FUNCTION public.war_hook_module_progress();

-- ---------------------------------------------------------
-- Trigger: quiz respondido (quiz_scores)
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION public.war_hook_quiz_scores()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_amount integer;
BEGIN
  BEGIN
    v_amount := GREATEST(COALESCE(NEW.correct_answers, 0), 0);
    IF COALESCE(NEW.total_questions, 0) > 0 THEN
      v_amount := LEAST(v_amount, NEW.total_questions);
    END IF;
    IF v_amount > 0 THEN
      PERFORM public.ingest_war_event(
        NEW.user_id, 'quiz_acertado', v_amount, 'quiz:' || NEW.id::text);
    END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_war_hook_quiz_scores ON public.quiz_scores;
CREATE TRIGGER trg_war_hook_quiz_scores
AFTER INSERT ON public.quiz_scores
FOR EACH ROW EXECUTE FUNCTION public.war_hook_quiz_scores();

-- ---------------------------------------------------------
-- Trigger: kudos enviado (kudos)
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION public.war_hook_kudos()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  BEGIN
    IF NEW.from_user_id IS NOT NULL AND NEW.from_user_id <> NEW.to_user_id THEN
      PERFORM public.ingest_war_event(
        NEW.from_user_id, 'feedback_enviado', 1, 'kudos:' || NEW.id::text);
    END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_war_hook_kudos ON public.kudos;
CREATE TRIGGER trg_war_hook_kudos
AFTER INSERT ON public.kudos
FOR EACH ROW EXECUTE FUNCTION public.war_hook_kudos();

-- Indice de apoio: o gancho consulta guerras em andamento a cada evento.
CREATE INDEX IF NOT EXISTS idx_department_wars_running
  ON public.department_wars (status, starts_at, ends_at)
  WHERE status = 'running';