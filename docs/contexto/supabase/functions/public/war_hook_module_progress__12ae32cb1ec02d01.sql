CREATE OR REPLACE FUNCTION public.war_hook_module_progress()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN BEGIN IF NEW.completed_at IS NOT NULL AND (TG_OP = 'INSERT' OR OLD.completed_at IS NULL) THEN PERFORM public.ingest_war_event(NEW.user_id, 'modulo_concluido', 1, 'module:' || NEW.id::text); END IF; EXCEPTION WHEN OTHERS THEN NULL; END; RETURN NULL; END; $function$
