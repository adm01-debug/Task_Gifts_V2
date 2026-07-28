-- Concessão interna de pacote: sem checagem de auth (é o banco quem chama),
-- mas com a MESMA chave de idempotência da RPC pública grant_card_pack.
CREATE OR REPLACE FUNCTION public._grant_card_pack_internal(
  p_user_id UUID,
  p_source TEXT,
  p_source_ref TEXT,
  p_size INTEGER
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_key TEXT;
  v_id UUID;
  v_size INTEGER := GREATEST(1, LEAST(COALESCE(p_size, 5), 20));
  v_ref TEXT := NULLIF(btrim(COALESCE(p_source_ref, '')), '');
BEGIN
  IF p_user_id IS NULL THEN RETURN NULL; END IF;
  IF p_source NOT IN ('task','training','quest','campaign','manual','streak') THEN RETURN NULL; END IF;

  v_key := 'pack:' || p_source || ':' || COALESCE(v_ref, 'none');
  IF length(v_key) > 160 THEN RETURN NULL; END IF;

  INSERT INTO public.card_packs (user_id, source, source_ref, dedupe_key, size)
  VALUES (p_user_id, p_source, v_ref, v_key, v_size)
  ON CONFLICT (user_id, dedupe_key) DO NOTHING
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public._grant_card_pack_internal(UUID, TEXT, TEXT, INTEGER) FROM PUBLIC, anon, authenticated;

-- 1) Tarefa entregue no prazo
CREATE OR REPLACE FUNCTION public.card_pack_hook_task_scores()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status <> 'on_time'::task_completion_status THEN RETURN NEW; END IF;
  IF NEW.is_late THEN RETURN NEW; END IF;
  IF COALESCE(NEW.rework_count, 0) > 0 THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.status = 'on_time'::task_completion_status THEN RETURN NEW; END IF;

  PERFORM public._grant_card_pack_internal(NEW.user_id, 'task', NEW.id::text, 3);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_card_pack_task_scores ON public.task_scores;
CREATE TRIGGER trg_card_pack_task_scores
AFTER INSERT OR UPDATE OF status, is_late, rework_count ON public.task_scores
FOR EACH ROW EXECUTE FUNCTION public.card_pack_hook_task_scores();

-- 2) Trilha concluída
CREATE OR REPLACE FUNCTION public.card_pack_hook_trail_enrollments()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.completed_at IS NULL THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.completed_at IS NOT NULL THEN RETURN NEW; END IF;

  PERFORM public._grant_card_pack_internal(NEW.user_id, 'training', NEW.trail_id::text, 5);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_card_pack_trail_enrollments ON public.trail_enrollments;
CREATE TRIGGER trg_card_pack_trail_enrollments
AFTER INSERT OR UPDATE OF completed_at ON public.trail_enrollments
FOR EACH ROW EXECUTE FUNCTION public.card_pack_hook_trail_enrollments();

-- 3) Marcos de sequência de presença (a cada 5 dias, teto 100)
CREATE OR REPLACE FUNCTION public.card_pack_hook_attendance_streaks()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_new INTEGER := floor(LEAST(GREATEST(COALESCE(NEW.current_streak, 0), 0), 100) / 5) * 5;
  v_old INTEGER := 0;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    v_old := floor(LEAST(GREATEST(COALESCE(OLD.current_streak, 0), 0), 100) / 5) * 5;
  END IF;

  IF v_new = 0 OR v_new <= v_old THEN RETURN NEW; END IF;

  PERFORM public._grant_card_pack_internal(
    NEW.user_id, 'streak', NEW.user_id::text || ':' || v_new::text, 4
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_card_pack_attendance_streaks ON public.attendance_streaks;
CREATE TRIGGER trg_card_pack_attendance_streaks
AFTER INSERT OR UPDATE OF current_streak ON public.attendance_streaks
FOR EACH ROW EXECUTE FUNCTION public.card_pack_hook_attendance_streaks();