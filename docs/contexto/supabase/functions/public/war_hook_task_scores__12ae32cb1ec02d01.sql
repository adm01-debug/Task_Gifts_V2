CREATE OR REPLACE FUNCTION public.war_hook_task_scores()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN BEGIN IF NEW.completed_at IS NOT NULL AND (TG_OP = 'INSERT' OR OLD.completed_at IS NULL) AND lower(NEW.status::text) = 'completed' THEN PERFORM public.ingest_war_event(NEW.user_id, 'tarefa_concluida', 1, 'task:' || NEW.id::text); IF NEW.is_late IS FALSE THEN PERFORM public.ingest_war_event(NEW.user_id, 'tarefa_no_prazo', 1, 'task_ontime:' || NEW.id::text); END IF; END IF; EXCEPTION WHEN OTHERS THEN NULL; END; RETURN NULL; END; $function$
