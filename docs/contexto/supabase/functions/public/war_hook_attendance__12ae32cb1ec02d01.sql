CREATE OR REPLACE FUNCTION public.war_hook_attendance()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN BEGIN IF NEW.is_punctual IS TRUE AND NEW.check_in IS NOT NULL THEN PERFORM public.ingest_war_event(NEW.user_id, 'checkin_pontual', 1, 'attendance:' || NEW.id::text); END IF; EXCEPTION WHEN OTHERS THEN NULL; END; RETURN NULL; END; $function$
