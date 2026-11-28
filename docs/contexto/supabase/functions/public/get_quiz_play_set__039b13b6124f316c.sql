CREATE OR REPLACE FUNCTION public.get_quiz_play_set(p_quiz_type text, p_limit integer DEFAULT 10)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE(jsonb_agg(q ORDER BY q->>'created_at' DESC), '[]'::jsonb) FROM (SELECT jsonb_build_object('id', qq.id, 'quiz_type', qq.quiz_type, 'question', qq.question, 'explanation', qq.explanation, 'points', qq.points, 'difficulty', qq.difficulty, 'category', qq.category, 'department_id', qq.department_id, 'created_at', qq.created_at, 'options', COALESCE((SELECT jsonb_agg(jsonb_build_object('id', o.id, 'text', o.text, 'order_index', o.order_index) ORDER BY o.order_index) FROM public.quiz_options o WHERE o.question_id = qq.id), '[]'::jsonb)) AS q FROM public.quiz_questions qq WHERE qq.is_active = true AND qq.quiz_type = p_quiz_type AND auth.uid() IS NOT NULL ORDER BY qq.created_at DESC LIMIT GREATEST(COALESCE(p_limit, 10), 1)) s;
$function$
