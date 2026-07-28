-- Aplicação interna de dano (não depende de auth.uid(), usada por triggers).
CREATE OR REPLACE FUNCTION public.apply_boss_damage_internal(
  _user_id UUID,
  _source TEXT,
  _dedupe_key TEXT,
  _source_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_dept UUID;
  v_battle public.boss_battles%ROWTYPE;
  v_base INTEGER;
  v_cap INTEGER;
  v_user_total INTEGER;
  v_allowed INTEGER;
  v_applied INTEGER;
BEGIN
  IF _user_id IS NULL THEN RETURN NULL; END IF;
  IF _dedupe_key IS NULL OR length(_dedupe_key) = 0 OR length(_dedupe_key) > 200 THEN RETURN NULL; END IF;
  IF _source NOT IN ('task_score','trail_completion','attendance','quiz') THEN RETURN NULL; END IF;

  v_dept := public.get_user_department_id(_user_id);

  -- Seleção determinística: departamento > global, depois término mais próximo, depois id.
  SELECT * INTO v_battle
    FROM public.boss_battles b
   WHERE b.status = 'running'
     AND now() BETWEEN b.starts_at AND b.ends_at
     AND b.current_hp > 0
     AND (b.department_id IS NULL OR b.department_id = v_dept)
   ORDER BY (b.department_id IS NULL), b.ends_at, b.id
   LIMIT 1;

  IF NOT FOUND THEN RETURN NULL; END IF;

  IF EXISTS (
    SELECT 1 FROM public.boss_battle_damage
     WHERE battle_id = v_battle.id AND dedupe_key = _dedupe_key
  ) THEN
    RETURN NULL;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(v_battle.id::text, 42));

  SELECT * INTO v_battle FROM public.boss_battles WHERE id = v_battle.id FOR UPDATE;
  IF v_battle.current_hp <= 0 THEN RETURN NULL; END IF;

  v_base := GREATEST(COALESCE((COALESCE(v_battle.damage_rules, '{}'::jsonb) -> 'base' ->> _source)::INTEGER, 0), 0);
  IF v_base = 0 THEN RETURN NULL; END IF;

  v_cap := GREATEST(v_battle.per_user_cap, 0);
  v_allowed := v_base;
  IF v_cap > 0 THEN
    SELECT COALESCE(SUM(damage), 0) INTO v_user_total
      FROM public.boss_battle_damage WHERE battle_id = v_battle.id AND user_id = _user_id;
    v_allowed := LEAST(v_base, GREATEST(v_cap - v_user_total, 0));
  END IF;

  v_applied := LEAST(v_allowed, v_battle.current_hp);

  INSERT INTO public.boss_battle_damage (battle_id, user_id, department_id, source, source_id, damage, wasted, dedupe_key)
  VALUES (v_battle.id, _user_id, v_dept, _source, _source_id, v_applied, v_base - v_applied, _dedupe_key)
  ON CONFLICT DO NOTHING;

  UPDATE public.boss_battles
     SET current_hp = current_hp - v_applied,
         status = CASE WHEN current_hp - v_applied = 0 THEN 'defeated' ELSE status END,
         defeated_at = CASE WHEN current_hp - v_applied = 0 THEN now() ELSE defeated_at END
   WHERE id = v_battle.id;

  RETURN v_battle.id;
END;
$$;

REVOKE ALL ON FUNCTION public.apply_boss_damage_internal(UUID, TEXT, TEXT, UUID) FROM PUBLIC, anon, authenticated;

-- Gatilho: tarefa entregue no prazo.
CREATE OR REPLACE FUNCTION public.boss_hook_task_scores()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status <> 'on_time' THEN RETURN NEW; END IF;
  IF COALESCE(NEW.is_late, false) THEN RETURN NEW; END IF;
  IF COALESCE(NEW.rework_count, 0) > 0 THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.status = 'on_time' THEN RETURN NEW; END IF;

  PERFORM public.apply_boss_damage_internal(
    NEW.user_id, 'task_score', 'boss:task_score:' || NEW.id::text, NEW.id
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_boss_damage_task_scores ON public.task_scores;
CREATE TRIGGER trg_boss_damage_task_scores
AFTER INSERT OR UPDATE ON public.task_scores
FOR EACH ROW EXECUTE FUNCTION public.boss_hook_task_scores();

-- Gatilho: trilha concluída.
CREATE OR REPLACE FUNCTION public.boss_hook_trail_enrollments()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.completed_at IS NULL THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.completed_at IS NOT NULL THEN RETURN NEW; END IF;

  PERFORM public.apply_boss_damage_internal(
    NEW.user_id, 'trail_completion',
    'boss:trail_completion:' || NEW.user_id::text || ':' || NEW.trail_id::text,
    NEW.trail_id
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_boss_damage_trail_enrollments ON public.trail_enrollments;
CREATE TRIGGER trg_boss_damage_trail_enrollments
AFTER INSERT OR UPDATE ON public.trail_enrollments
FOR EACH ROW EXECUTE FUNCTION public.boss_hook_trail_enrollments();

-- Gatilho: presença pontual (uma vez por dia).
CREATE OR REPLACE FUNCTION public.boss_hook_attendance_streaks()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.last_punctual_date IS NULL THEN RETURN NEW; END IF;
  IF COALESCE(NEW.current_streak, 0) <= 0 THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.last_punctual_date IS NOT DISTINCT FROM NEW.last_punctual_date THEN RETURN NEW; END IF;

  PERFORM public.apply_boss_damage_internal(
    NEW.user_id, 'attendance',
    'boss:attendance:' || NEW.user_id::text || ':' || NEW.last_punctual_date::text,
    NULL
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_boss_damage_attendance_streaks ON public.attendance_streaks;
CREATE TRIGGER trg_boss_damage_attendance_streaks
AFTER INSERT OR UPDATE ON public.attendance_streaks
FOR EACH ROW EXECUTE FUNCTION public.boss_hook_attendance_streaks();