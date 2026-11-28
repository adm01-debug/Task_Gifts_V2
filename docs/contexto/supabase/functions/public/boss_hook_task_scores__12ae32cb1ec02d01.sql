CREATE OR REPLACE FUNCTION public.boss_hook_task_scores()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status <> 'on_time' THEN RETURN NEW; END IF;
  IF COALESCE(NEW.is_late, false) THEN RETURN NEW; END IF;
  IF COALESCE(NEW.rework_count, 0) > 0 THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.status = 'on_time' THEN RETURN NEW; END IF;
  PERFORM public.apply_boss_damage_internal(NEW.user_id, 'task_score', 'boss:task_score:' || NEW.id::text, NEW.id);
  RETURN NEW;
END; $function$
