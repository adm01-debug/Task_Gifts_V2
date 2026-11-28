CREATE OR REPLACE FUNCTION public.war_hook_kudos()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN BEGIN IF NEW.from_user_id IS NOT NULL AND NEW.from_user_id <> NEW.to_user_id THEN PERFORM public.ingest_war_event(NEW.from_user_id, 'feedback_enviado', 1, 'kudos:' || NEW.id::text); END IF; EXCEPTION WHEN OTHERS THEN NULL; END; RETURN NULL; END; $function$
