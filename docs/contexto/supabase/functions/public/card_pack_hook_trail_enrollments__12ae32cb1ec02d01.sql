CREATE OR REPLACE FUNCTION public.card_pack_hook_trail_enrollments()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.completed_at IS NULL THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.completed_at IS NOT NULL THEN RETURN NEW; END IF;
  PERFORM public._grant_card_pack_internal(NEW.user_id, 'training', NEW.trail_id::text, 5);
  RETURN NEW;
END; $function$
