CREATE OR REPLACE FUNCTION public.trim_push_sync_events()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM public.push_sync_events e WHERE e.user_id = NEW.user_id AND e.id NOT IN (SELECT id FROM public.push_sync_events WHERE user_id = NEW.user_id ORDER BY created_at DESC LIMIT 20);
  RETURN NULL;
END;
$function$
