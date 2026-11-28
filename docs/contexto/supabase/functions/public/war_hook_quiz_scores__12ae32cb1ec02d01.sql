CREATE OR REPLACE FUNCTION public.war_hook_quiz_scores()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_amount integer;
BEGIN BEGIN v_amount := GREATEST(COALESCE(NEW.correct_answers, 0), 0); IF COALESCE(NEW.total_questions, 0) > 0 THEN v_amount := LEAST(v_amount, NEW.total_questions); END IF; IF v_amount > 0 THEN PERFORM public.ingest_war_event(NEW.user_id, 'quiz_acertado', v_amount, 'quiz:' || NEW.id::text); END IF; EXCEPTION WHEN OTHERS THEN NULL; END; RETURN NULL; END; $function$
