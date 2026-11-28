CREATE OR REPLACE FUNCTION public.boss_hook_attendance_streaks()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.last_punctual_date IS NULL THEN RETURN NEW; END IF;
  IF COALESCE(NEW.current_streak, 0) <= 0 THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.last_punctual_date IS NOT DISTINCT FROM NEW.last_punctual_date THEN RETURN NEW; END IF;
  PERFORM public.apply_boss_damage_internal(NEW.user_id, 'attendance', 'boss:attendance:' || NEW.user_id::text || ':' || NEW.last_punctual_date::text, NULL);
  RETURN NEW;
END; $function$
