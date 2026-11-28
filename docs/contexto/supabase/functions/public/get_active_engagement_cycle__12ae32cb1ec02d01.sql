CREATE OR REPLACE FUNCTION public.get_active_engagement_cycle()
 RETURNS engagement_cycles
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT * FROM public.engagement_cycles WHERE status = 'active' AND starts_at <= now() AND ends_at >= now() ORDER BY starts_at DESC LIMIT 1;
$function$
