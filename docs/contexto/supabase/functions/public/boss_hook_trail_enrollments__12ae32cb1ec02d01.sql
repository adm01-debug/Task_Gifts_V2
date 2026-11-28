CREATE OR REPLACE FUNCTION public.boss_hook_trail_enrollments()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.completed_at IS NULL THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.completed_at IS NOT NULL THEN RETURN NEW; END IF;
  PERFORM public.apply_boss_damage_internal(NEW.user_id, 'trail_completion', 'boss:trail_completion:' || NEW.user_id::text || ':' || NEW.trail_id::text, NEW.trail_id);
  RETURN NEW;
END; $function$
