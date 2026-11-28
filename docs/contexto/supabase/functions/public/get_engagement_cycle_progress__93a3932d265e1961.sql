CREATE OR REPLACE FUNCTION public.get_engagement_cycle_progress(p_cycle_id uuid)
 RETURNS TABLE(total integer, answered integer, pending integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT count(*)::int, count(*) FILTER (WHERE answered_at IS NOT NULL)::int, count(*) FILTER (WHERE answered_at IS NULL)::int FROM public.engagement_question_assignments WHERE cycle_id = p_cycle_id AND user_id = auth.uid();
$function$
