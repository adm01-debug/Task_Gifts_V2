CREATE OR REPLACE FUNCTION public.quiz_fifty_fifty(p_question_id uuid)
 RETURNS uuid[]
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE(array_agg(x.id), ARRAY[]::uuid[]) FROM (SELECT o.id FROM public.quiz_options o JOIN public.quiz_questions qq ON qq.id = o.question_id AND qq.is_active WHERE o.question_id = p_question_id AND o.is_correct = false AND auth.uid() IS NOT NULL ORDER BY random() LIMIT 2) x;
$function$
