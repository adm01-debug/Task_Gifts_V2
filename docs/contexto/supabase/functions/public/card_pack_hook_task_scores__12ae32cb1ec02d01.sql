CREATE OR REPLACE FUNCTION public.card_pack_hook_task_scores()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status <> 'on_time'::task_completion_status THEN RETURN NEW; END IF;
  IF NEW.is_late THEN RETURN NEW; END IF;
  IF COALESCE(NEW.rework_count, 0) > 0 THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.status = 'on_time'::task_completion_status THEN RETURN NEW; END IF;
  PERFORM public._grant_card_pack_internal(NEW.user_id, 'task', NEW.id::text, 3);
  RETURN NEW;
END; $function$
