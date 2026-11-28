CREATE OR REPLACE FUNCTION public.guard_engagement_answer_assignment()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin'::public.app_role) THEN RETURN NEW; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.engagement_question_assignments a WHERE a.cycle_id = NEW.cycle_id AND a.question_id = NEW.question_id AND a.user_id = NEW.user_id) THEN
    RAISE EXCEPTION 'resposta sem atribuicao no ciclo' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END; $function$
