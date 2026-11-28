CREATE OR REPLACE FUNCTION public.reset_push_failures(_ids uuid[])
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.push_subscriptions
     SET failure_count = 0,
         last_used_at  = now(),
         updated_at    = now()
   WHERE id = ANY(_ids);
END;
$function$
